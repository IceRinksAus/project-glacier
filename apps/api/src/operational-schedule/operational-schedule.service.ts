import { fromZonedTime } from 'date-fns-tz';

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

if (!event.timezone) {
  throw new BadRequestException(
    'Event timezone must be configured before generating schedules.',
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

if (
  data.pattern !== 'DAILY' &&
  data.pattern !== 'WEEKDAY_WEEKEND' &&
  data.pattern !== 'SELECTED_DAYS' &&
  data.pattern !== 'MANUAL'
) {
  throw new BadRequestException(
    `Schedule pattern "${data.pattern}" is not supported yet.`,
  );
}

const {
  timetableDefinition,
  sessionData,
  operationalBlocks,
} = this.prepareSchedule(
  data,
  scheduleStart,
  scheduleEnd,
  event.timezone,
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
              timetableDefinition as unknown as Prisma.InputJsonValue,
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
        operationalBlocks,
      };
    });
  }

  private prepareSchedule(
    data: CreateOperationalScheduleDto,
    scheduleStart: Date,
    scheduleEnd: Date,
    timezone: string,
  ) {
    if (data.pattern === 'DAILY') {
      const timetable = data.timetable ?? [];

      if (!timetable.length) {
        throw new BadRequestException(
          'At least one timetable entry is required.',
        );
      }

      this.validateTimetable(timetable);

      const bookableEntries = timetable.filter(
        (entry) => entry.type === 'BOOKABLE',
      );

const sessionData = this.buildDailySessions(
  scheduleStart,
  scheduleEnd,
  bookableEntries,
  data.eventId,
  timezone,
);

      return {
        timetableDefinition: timetable,
        sessionData,
        operationalBlocks: timetable.filter(
          (entry) => entry.type === 'OPERATIONAL',
        ).length,
      };
    }

    if (data.pattern === 'SELECTED_DAYS') {
  const timetable = data.timetable ?? [];
  const selectedDays = data.selectedDays ?? [];

  if (!timetable.length) {
    throw new BadRequestException(
      'At least one timetable entry is required.',
    );
  }

  if (!selectedDays.length) {
    throw new BadRequestException(
      'At least one day must be selected.',
    );
  }

  const hasInvalidSelectedDay =
    selectedDays.some(
      (day) =>
        !Number.isInteger(day) ||
        day < 0 ||
        day > 6,
    );

  if (hasInvalidSelectedDay) {
    throw new BadRequestException(
      'Selected days must be numbers from 0 to 6.',
    );
  }

  if (
    new Set(selectedDays).size !==
    selectedDays.length
  ) {
    throw new BadRequestException(
      'Selected days must not contain duplicates.',
    );
  }

  this.validateTimetable(timetable);

  const bookableEntries = timetable.filter(
    (entry) => entry.type === 'BOOKABLE',
  );

  const sessionData =
    this.buildSelectedDaysSessions(
      scheduleStart,
      scheduleEnd,
      bookableEntries,
      selectedDays,
      data.eventId,
      timezone,
    );

  return {
    timetableDefinition: {
      selectedDays,
      timetable,
    },
    sessionData,
    operationalBlocks: timetable.filter(
      (entry) => entry.type === 'OPERATIONAL',
    ).length,
  };
}

if (data.pattern === 'MANUAL') {
  const manualDays = data.manualDays ?? [];

  if (!manualDays.length) {
    throw new BadRequestException(
      'At least one manual schedule day is required.',
    );
  }

  const seenDates = new Set<string>();

  for (const manualDay of manualDays) {
    const manualDate = new Date(
      `${manualDay.date}T00:00:00.000Z`,
    );

    if (Number.isNaN(manualDate.getTime())) {
      throw new BadRequestException(
        `Manual schedule date "${manualDay.date}" is invalid.`,
      );
    }

    if (
      manualDate < scheduleStart ||
      manualDate > scheduleEnd
    ) {
      throw new BadRequestException(
        `Manual schedule date "${manualDay.date}" must remain within the schedule date range.`,
      );
    }

    if (seenDates.has(manualDay.date)) {
      throw new BadRequestException(
        `Manual schedule date "${manualDay.date}" is duplicated.`,
      );
    }

    seenDates.add(manualDay.date);

    if (!manualDay.timetable.length) {
      throw new BadRequestException(
        `Manual schedule date "${manualDay.date}" requires at least one timetable entry.`,
      );
    }

    this.validateTimetable(
      manualDay.timetable,
    );
  }

  const sessionData =
    this.buildManualSessions(
      manualDays,
      data.eventId,
      timezone,
    );

  return {
    timetableDefinition: {
      manualDays,
    },
    sessionData,
    operationalBlocks:
      manualDays.reduce(
        (total, manualDay) =>
          total +
          manualDay.timetable.filter(
            (entry) =>
              entry.type === 'OPERATIONAL',
          ).length,
        0,
      ),
  };
}

    const weekdayTimetable =
      data.weekdayTimetable ?? [];

    const weekendTimetable =
      data.weekendTimetable ?? [];

    if (!weekdayTimetable.length) {
      throw new BadRequestException(
        'At least one weekday timetable entry is required.',
      );
    }

    if (!weekendTimetable.length) {
      throw new BadRequestException(
        'At least one weekend timetable entry is required.',
      );
    }

    this.validateTimetable(weekdayTimetable);
    this.validateTimetable(weekendTimetable);

const sessionData =
  this.buildWeekdayWeekendSessions(
    scheduleStart,
    scheduleEnd,
    weekdayTimetable,
    weekendTimetable,
    data.eventId,
    timezone,
  );

    return {
      timetableDefinition: {
        weekdayTimetable,
        weekendTimetable,
      },
      sessionData,
      operationalBlocks:
        weekdayTimetable.filter(
          (entry) => entry.type === 'OPERATIONAL',
        ).length +
        weekendTimetable.filter(
          (entry) => entry.type === 'OPERATIONAL',
        ).length,
    };
  }

  private validateTimetable(
    entries: OperationalScheduleEntryDto[],
  ) {
    entries.forEach((entry) => {
      this.validateEntry(entry);
    });

    const bookableEntries = entries.filter(
      (entry) => entry.type === 'BOOKABLE',
    );

    this.validateTimetableConflicts(
      bookableEntries,
    );
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
    const sortedEntries = [...entries].sort(
      (a, b) =>
        a.startTime.localeCompare(b.startTime),
    );

    for (
      let index = 0;
      index < sortedEntries.length - 1;
      index++
    ) {
      const currentEntry = sortedEntries[index];
      const nextEntry = sortedEntries[index + 1];

      const currentStart =
        this.timeToMinutes(
          currentEntry.startTime,
        );

      const currentEnd =
        currentStart + currentEntry.duration;

      const nextStart =
        this.timeToMinutes(
          nextEntry.startTime,
        );

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

private buildDailySessions(
  startDate: Date,
  endDate: Date,
  entries: OperationalScheduleEntryDto[],
  eventId: string,
  timezone: string,
) {
    const sessions =
      this.createSessionCollection();

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
this.addEntriesForDate(
  sessions,
  currentDate,
  entries,
  eventId,
  timezone,
);

      currentDate.setUTCDate(
        currentDate.getUTCDate() + 1,
      );
    }

    return sessions;
  }

  private buildSelectedDaysSessions(
  startDate: Date,
  endDate: Date,
  entries: OperationalScheduleEntryDto[],
  selectedDays: number[],
  eventId: string,
  timezone: string,
) {
  const sessions =
    this.createSessionCollection();

  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek =
      currentDate.getUTCDay();

    if (selectedDays.includes(dayOfWeek)) {
      this.addEntriesForDate(
        sessions,
        currentDate,
        entries,
        eventId,
        timezone,
      );
    }

    currentDate.setUTCDate(
      currentDate.getUTCDate() + 1,
    );
  }

  return sessions;
}

private buildManualSessions(
  manualDays: {
    date: string;
    timetable: OperationalScheduleEntryDto[];
  }[],
  eventId: string,
  timezone: string,
) {
  const sessions =
    this.createSessionCollection();

  for (const manualDay of manualDays) {
    const date = new Date(
      `${manualDay.date}T00:00:00.000Z`,
    );

    const bookableEntries =
      manualDay.timetable.filter(
        (entry) =>
          entry.type === 'BOOKABLE',
      );

    this.addEntriesForDate(
      sessions,
      date,
      bookableEntries,
      eventId,
      timezone,
    );
  }

  return sessions;
}

  private buildWeekdayWeekendSessions(
    startDate: Date,
    endDate: Date,
    weekdayEntries: OperationalScheduleEntryDto[],
    weekendEntries: OperationalScheduleEntryDto[],
    eventId: string,
    timezone: string,
  ) {
    const sessions =
      this.createSessionCollection();

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek =
        currentDate.getUTCDay();

      const isWeekend =
        dayOfWeek === 0 || dayOfWeek === 6;

      const entries = isWeekend
        ? weekendEntries
        : weekdayEntries;

      const bookableEntries = entries.filter(
        (entry) => entry.type === 'BOOKABLE',
      );

this.addEntriesForDate(
  sessions,
  currentDate,
  bookableEntries,
  eventId,
  timezone,
);

      currentDate.setUTCDate(
        currentDate.getUTCDate() + 1,
      );
    }

    return sessions;
  }

  private createSessionCollection() {
    return [] as {
      name: string;
      startDate: Date;
      endDate: Date;
      capacity: number;
      status: string;
      eventId: string;
      scheduleEntryId: string;
    }[];
  }

  private addEntriesForDate(
    sessions: ReturnType<
      OperationalScheduleService['createSessionCollection']
    >,
    date: Date,
    entries: OperationalScheduleEntryDto[],
    eventId: string,
    timezone: string,
  ) {
    for (const entry of entries) {
const sessionStart =
  this.combineDateAndTime(
    date,
    entry.startTime,
    timezone,
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
  }

private combineDateAndTime(
  date: Date,
  time: string,
  timezone: string,
) {
  const year = date.getUTCFullYear();
  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getUTCDate(),
  ).padStart(2, '0');

  const localDateTime =
    `${year}-${month}-${day}T${time}:00`;

  return fromZonedTime(
    localDateTime,
    timezone,
  );
}
}