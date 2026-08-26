import { Prisma, TicketScanAttemptResult, TicketStatus } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { ScannerTicketDto } from './dto/scanner-ticket.dto';
import { ScannerClock } from './scanner-clock';
import { ScannerTicketResult } from './staff-scanner.types';

type ScannerTicket = Prisma.TicketGetPayload<{
  include: {
    participant: { include: { ticketType: true } };
    booking: { include: { event: true; session: true } };
    originalRescheduleMapping: {
      select: { replacementTicketNumberSnapshot: true };
    };
  };
}>;

interface ScannerEvent {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  entryOpensMinutesBeforeStart: number;
  entryClosesMinutesAfterEnd: number;
}

@Injectable()
export class StaffScannerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: ScannerClock,
    private readonly accessControl: AccessControlService,
  ) {}

  findActiveEvents(access: AuthenticatedAccessContext) {
    return this.prisma.event.findMany({
      where: this.accessControl.eventWhere(access, { status: 'ACTIVE' }),
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        timezone: true,
        venueName: true,
        entryOpensMinutesBeforeStart: true,
        entryClosesMinutesAfterEnd: true,
      },
    });
  }

  async getEventContext(access: AuthenticatedAccessContext, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: this.accessControl.eventWhere(access, {
        id: eventId,
        status: 'ACTIVE',
      }),
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        timezone: true,
        venueName: true,
        entryOpensMinutesBeforeStart: true,
        entryClosesMinutesAfterEnd: true,
      },
    });

    if (!event) throw new NotFoundException('Scanner event not found');
    return event;
  }

  async lookup(
    access: AuthenticatedAccessContext,
    eventId: string,
    input: ScannerTicketDto,
  ) {
    const event = await this.getEventContext(access, eventId);
    const ticket = await this.findTicket(access.organizationId, input.token);
    return this.buildResult(event, ticket, eventId, this.clock.now());
  }

  async admit(
    access: AuthenticatedAccessContext,
    eventId: string,
    input: ScannerTicketDto,
  ) {
    const event = await this.getEventContext(access, eventId);
    const now = this.clock.now();

    return this.prisma.$transaction(async (transaction) => {
      const ticket = await this.findTicket(
        access.organizationId,
        input.token,
        transaction,
      );
      const result = this.buildResult(event, ticket, eventId, now);

      if (result.result !== ScannerTicketResult.READY_TO_ADMIT || !ticket) {
        await this.recordAttempt(transaction, {
          organizationId: access.organizationId,
          eventId,
          userId: access.userId,
          ticketId: ticket?.booking.eventId === eventId ? ticket.id : null,
          mode: input.mode,
          result: this.toAttemptResult(result.result),
          priorCheckedInAt: ticket?.checkedInAt ?? null,
          attemptedAt: now,
        });
        return result;
      }

      const updated = await transaction.ticket.updateMany({
        where: { id: ticket.id, status: TicketStatus.ACTIVE },
        data: { status: TicketStatus.SCANNED, checkedInAt: now },
      });

      if (updated.count !== 1) {
        const current = await this.findTicket(
          access.organizationId,
          input.token,
          transaction,
        );
        const concurrentResult = this.buildResult(event, current, eventId, now);
        await this.recordAttempt(transaction, {
          organizationId: access.organizationId,
          eventId,
          userId: access.userId,
          ticketId: current?.id ?? ticket.id,
          mode: input.mode,
          result: this.toAttemptResult(concurrentResult.result),
          priorCheckedInAt: current?.checkedInAt ?? null,
          attemptedAt: now,
        });
        return concurrentResult;
      }

      await this.recordAttempt(transaction, {
        organizationId: access.organizationId,
        eventId,
        userId: access.userId,
        ticketId: ticket.id,
        mode: input.mode,
        result: TicketScanAttemptResult.ENTRY_GRANTED,
        priorCheckedInAt: ticket.checkedInAt,
        attemptedAt: now,
      });

      return {
        ...result,
        result: ScannerTicketResult.ENTRY_GRANTED,
        status: TicketStatus.SCANNED,
        checkedInAt: now,
      };
    });
  }

  private findTicket(
    organizationId: string,
    token: string,
    prisma: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<ScannerTicket | null> {
    return prisma.ticket.findFirst({
      where: { secureToken: token, booking: { event: { organizationId } } },
      include: {
        participant: { include: { ticketType: true } },
        booking: { include: { event: true, session: true } },
        originalRescheduleMapping: {
          select: { replacementTicketNumberSnapshot: true },
        },
      },
    });
  }

  private buildResult(
    event: ScannerEvent,
    ticket: ScannerTicket | null,
    eventId: string,
    now: Date,
  ) {
    if (!ticket) return { result: ScannerTicketResult.INVALID };
    if (ticket.booking.eventId !== eventId)
      return { result: ScannerTicketResult.INVALID_FOR_EVENT };

    const start = ticket.booking.session?.startDate ?? event.startDate;
    const end = ticket.booking.session?.endDate ?? event.endDate;
    const opensAt = new Date(
      start.getTime() - event.entryOpensMinutesBeforeStart * 60_000,
    );
    const closesAt = new Date(
      end.getTime() + event.entryClosesMinutesAfterEnd * 60_000,
    );

    let result = ScannerTicketResult.READY_TO_ADMIT;
    if (ticket.status === TicketStatus.SCANNED)
      result = ScannerTicketResult.ALREADY_SCANNED;
    else if (ticket.status === TicketStatus.CANCELLED)
      result = ScannerTicketResult.CANCELLED;
    else if (now < opensAt) result = ScannerTicketResult.NOT_YET_VALID;
    else if (now > closesAt) result = ScannerTicketResult.ENTRY_WINDOW_CLOSED;

    return {
      result,
      ticketNumber: ticket.ticketNumber,
      ticketType: ticket.participant.ticketType.name,
      issuedAt: ticket.issuedAt,
      status: ticket.status,
      checkedInAt: ticket.checkedInAt,
      replacementTicketNumber:
        ticket.originalRescheduleMapping?.replacementTicketNumberSnapshot ??
        null,
      participantName: [
        ticket.participant.firstName,
        ticket.participant.lastName,
      ]
        .filter(Boolean)
        .join(' '),
      eventName: event.name,
      sessionName: ticket.booking.session?.name ?? null,
      sessionStart: start,
      sessionEnd: end,
      entryOpensAt: opensAt,
      entryClosesAt: closesAt,
    };
  }

  private toAttemptResult(
    result: ScannerTicketResult,
  ): TicketScanAttemptResult {
    const mapping: Record<ScannerTicketResult, TicketScanAttemptResult> = {
      READY_TO_ADMIT: TicketScanAttemptResult.INVALID,
      ENTRY_GRANTED: TicketScanAttemptResult.ENTRY_GRANTED,
      ALREADY_SCANNED: TicketScanAttemptResult.ALREADY_SCANNED,
      CANCELLED: TicketScanAttemptResult.CANCELLED,
      NOT_YET_VALID: TicketScanAttemptResult.NOT_YET_VALID,
      ENTRY_WINDOW_CLOSED: TicketScanAttemptResult.ENTRY_WINDOW_CLOSED,
      INVALID_FOR_EVENT: TicketScanAttemptResult.WRONG_EVENT,
      INVALID: TicketScanAttemptResult.NOT_FOUND,
    };
    return mapping[result];
  }

  private recordAttempt(
    prisma: Prisma.TransactionClient,
    data: Prisma.TicketScanAttemptUncheckedCreateInput,
  ) {
    return prisma.ticketScanAttempt.create({ data });
  }
}
