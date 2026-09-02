import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketCredentialService } from './ticket-credential.service';

@Injectable()
export class TicketCredentialRotationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly credentials: TicketCredentialService,
  ) {}

  async rotate(ticketId: string, actor: AuthenticatedAccessContext) {
    if (actor.role !== 'OWNER' && actor.role !== 'MANAGER') {
      throw new ForbiddenException(
        'Only an Owner or Manager can reissue a Ticket link.',
      );
    }

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        booking: {
          event: this.accessControl.eventWhere(actor),
        },
      },
      select: {
        id: true,
        credentialSelector: true,
        credentialKeyId: true,
        legacyCredentialHash: true,
        booking: {
          select: { eventId: true },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const nextCredential = this.credentials.issue(ticket.id);
    const rotatedAt = new Date();

    await this.prisma.$transaction(async (transaction) => {
      const rotated = await transaction.ticket.updateMany({
        where: {
          id: ticket.id,
          credentialSelector: ticket.credentialSelector,
          credentialKeyId: ticket.credentialKeyId,
          legacyCredentialHash: ticket.legacyCredentialHash,
        },
        data: {
          credentialSelector: nextCredential.credentialSelector,
          credentialKeyId: nextCredential.credentialKeyId,
          legacyCredentialHash: null,
        },
      });

      if (rotated.count !== 1) {
        throw new ConflictException(
          'The Ticket link was already reissued. Refresh and try again.',
        );
      }

      await transaction.ticketCredentialRotationAudit.create({
        data: {
          organizationId: actor.organizationId,
          eventId: ticket.booking.eventId,
          ticketId: ticket.id,
          actorUserId: actor.userId,
          previousKeyId: ticket.credentialKeyId,
          newKeyId: nextCredential.credentialKeyId,
          legacyCredentialRevoked: ticket.legacyCredentialHash !== null,
          rotatedAt,
        },
      });
    });

    return {
      ticketId: ticket.id,
      credential: nextCredential.token,
      rotatedAt,
    };
  }
}
