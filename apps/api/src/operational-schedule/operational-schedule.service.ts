import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOperationalScheduleDto,
  OperationalScheduleEntryDto,
} from './dto/create-operational-schedule.dto';

@Injectable()
export class OperationalScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async createAndGenerate(
    organizationId: string,
    data: CreateOperationalScheduleDto,
  ) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: data.eventId,
        organizationId,
      },
    });

    if (!event) {
      throw new NotFoundException(
        'Event was not found in your organization.',
      );
    }

    const scheduleStart = new Date(
      `${data.startDate}T00:00:00.000Z`,
    );

    const scheduleEnd = new Date(
      `${data.endDate}T00:00:00.000Z`,
    );

    if (
      Number.isNaN(scheduleStart.getTime()) ||
      Number.isNaN(scheduleEnd.getTime())
    ) {
      throw new BadRequestException(
        'Schedule dates are invalid.',
      );
    }

    if (scheduleEnd < scheduleStart) {
      throw new BadRequestException(
        'Schedule end date must be on or after the start date.',
      );
    }

    if (
      scheduleStart < event.startDate ||
      scheduleEnd > event.endDate
    ) {
      throw new BadRequestException(
        'Operational schedule must remain within the event dates.',
      );
    }

    if (!data.name.trim()) {
      throw new BadRequestException(
        'Schedule name is required.',
      );
    }

    if (!data.timetable.length) {
      throw new BadRequestException(
        'At least one timetable entry is required.',
      );
    }

    data.timetable.forEach((entry) => {
      this.validateEntry(entry);
    });

    const bookableEntries = data.timetable.filter(
      (entry) => entry.type === 'BOOKABLE',
    );

    this.validateTimetableConflicts(bookableEntries);

    const sessionData = this.buildSessions(
      scheduleStart,
      scheduleEnd,
      bookableEntries,
      data.eventId,
    );

    return this.prisma.$transaction(async (tx) => {
      if (sessionData.length > 0) {
        const conflictingSession =
          await tx.session.findFirst({
            where: {
              eventId: data.eventId,
              OR: sessionData.map((session) => ({
                startDate: {
                  lt: session.endDate,
                },
                endDate: {
                  gt: session.startDate,
                },
              })),
            },
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          });

        if (conflictingSession) {
          throw new ConflictException(
            `This schedule conflicts with the existing session "${conflictingSession.name}" starting at ${conflictingSession.startDate.toISOString()}.`,
          );
        }
      }

      const schedule =
        await tx.operationalSchedule.create({
          data: {
            name: data.name.trim(),
            pattern: data.pattern,
            startDate: scheduleStart,
            endDate: scheduleEnd,
            timetable:
              data.timetable as unknown as Prisma.InputJsonValue,
            eventId: data.eventId,
          },
        });

      if (sessionData.length > 0) {
        await tx.session.createMany({
          data: sessionData.map((session) => ({
            ...session,
            operationalScheduleId: schedule.id,
          })),
        });
      }

      return {
        schedule,
        generatedSessions: sessionData.length,
        operationalBlocks: data.timetable.filter(
          (entry) => entry.type === 'OPERATIONAL',
        ).length,
      };
    });
  }

  private validateEntry(
    entry: OperationalScheduleEntryDto,
  ) {
    if (!entry.id) {
      throw new BadRequestException(
        'Every timetable entry requires an id.',
      );
    }

    if (!entry.name.trim()) {
      throw new BadRequestException(
        'Every timetable entry requires a name.',
      );
    }

    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        entry.startTime,
      )
    ) {
      throw new BadRequestException(
        `Invalid start time for "${entry.name}".`,
      );
    }

    if (
      !Number.isInteger(entry.duration) ||
      entry.duration <= 0
    ) {
      throw new BadRequestException(
        `Invalid duration for "${entry.name}".`,
      );
    }

    if (
      entry.type === 'BOOKABLE' &&
      (!Number.isInteger(entry.capacity) ||
        entry.capacity <= 0)
    ) {
      throw new BadRequestException(
        `Invalid capacity for "${entry.name}".`,
      );
    }
  }

  private validateTimetableConflicts(
    entries: OperationalScheduleEntryDto[],
  ) {
    const sortedEntries = [...entries].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );

    for (let index = 0; index < sortedEntries.length - 1; index++) {
      const currentEntry = sortedEntries[index];
      const nextEntry = sortedEntries[index + 1];

      const currentStart =
        this.timeToMinutes(currentEntry.startTime);

      const currentEnd =
        currentStart + currentEntry.duration;

      const nextStart =
        this.timeToMinutes(nextEntry.startTime);

      if (currentEnd > nextStart) {
        throw new ConflictException(
          `"${currentEntry.name}" overlaps with "${nextEntry.name}" in the timetable.`,
        );
      }
    }
  }

  private timeToMinutes(time: string) {
    const [hours, minutes] = time
      .split(':')
      .map(Number);

    return hours * 60 + minutes;
  }

  private buildSessions(
    startDate: Date,
    endDate: Date,
    entries: OperationalScheduleEntryDto[],
    eventId: string,
  ) {
    const sessions: {
      name: string;
      startDate: Date;
      endDate: Date;
      capacity: number;
      status: string;
      eventId: string;
      scheduleEntryId: string;
    }[] = [];

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      for (const entry of entries) {
        const sessionStart =
          this.combineDateAndTime(
            currentDate,
            entry.startTime,
          );

        const sessionEnd = new Date(
          sessionStart.getTime() +
            entry.duration * 60 * 1000,
        );

        sessions.push({
          name: entry.name.trim(),
          startDate: sessionStart,
          endDate: sessionEnd,
          capacity: entry.capacity,
          status: 'DRAFT',
          eventId,
          scheduleEntryId: entry.id,
        });
      }

      currentDate.setUTCDate(
        currentDate.getUTCDate() + 1,
      );
    }

    return sessions;
  }

  private combineDateAndTime(
    date: Date,
    time: string,
  ) {
    const [hours, minutes] = time
      .split(':')
      .map(Number);

    const result = new Date(date);

    result.setUTCHours(
      hours,
      minutes,
      0,
      0,
    );

    return result;
  }
}