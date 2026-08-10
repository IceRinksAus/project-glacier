import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { OperationalScheduleService } from './operational-schedule.service';

describe('OperationalScheduleService', () => {
  let service: OperationalScheduleService;

  const event = {
    id: 'event-1',
    name: 'Australian Ice Festival 2027',
    startDate: new Date('2027-06-25T00:00:00.000Z'),
    endDate: new Date('2027-07-18T00:00:00.000Z'),
    timezone: 'Australia/Melbourne',
    organizationId: 'org-1',
  };

  const createdSchedule = {
    id: 'schedule-1',
    name: 'Daily Festival Timetable',
    pattern: 'DAILY',
    startDate: new Date('2027-06-25T00:00:00.000Z'),
    endDate: new Date('2027-06-26T00:00:00.000Z'),
    timetable: [],
    eventId: 'event-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tx = {
    session: {
      findFirst: jest.fn(),
      createMany: jest.fn(),
    },
    operationalSchedule: {
      create: jest.fn(),
    },
  };

  const prisma = {
    event: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const basePayload = {
    eventId: 'event-1',
    name: 'Daily Festival Timetable',
    pattern: 'DAILY',
    startDate: '2027-06-25',
    endDate: '2027-06-26',
    timetable: [
      {
        id: 'public-skate-1000',
        name: 'Public Skate',
        startTime: '10:00',
        duration: 60,
        capacity: 200,
        type: 'BOOKABLE' as const,
      },
      {
        id: 'resurface-1100',
        name: 'Ice Resurfacing',
        startTime: '11:00',
        duration: 15,
        capacity: 0,
        type: 'OPERATIONAL' as const,
      },
      {
        id: 'public-skate-1115',
        name: 'Public Skate',
        startTime: '11:15',
        duration: 60,
        capacity: 200,
        type: 'BOOKABLE' as const,
      },
    ],
  };

  const weekdayWeekendPayload = {
    eventId: 'event-1',
    name: 'Weekday Weekend Timetable',
    pattern: 'WEEKDAY_WEEKEND',
    startDate: '2027-06-25',
    endDate: '2027-06-28',

    weekdayTimetable: [
      {
        id: 'weekday-public-1000',
        name: 'Weekday Public Skate',
        startTime: '10:00',
        duration: 60,
        capacity: 200,
        type: 'BOOKABLE' as const,
      },
      {
        id: 'weekday-resurface-1100',
        name: 'Weekday Ice Resurfacing',
        startTime: '11:00',
        duration: 15,
        capacity: 0,
        type: 'OPERATIONAL' as const,
      },
    ],

    weekendTimetable: [
      {
        id: 'weekend-public-0900',
        name: 'Weekend Public Skate',
        startTime: '09:00',
        duration: 60,
        capacity: 250,
        type: 'BOOKABLE' as const,
      },
      {
        id: 'weekend-disco-1900',
        name: 'Weekend Disco Skate',
        startTime: '19:00',
        duration: 60,
        capacity: 300,
        type: 'BOOKABLE' as const,
      },
    ],
  };

  const selectedDaysPayload = {
    eventId: 'event-1',
    name: 'Selected Days Timetable',
    pattern: 'SELECTED_DAYS',
    startDate: '2027-06-28',
    endDate: '2027-07-04',
    selectedDays: [1, 3, 5],
    timetable: [
      {
        id: 'selected-public-1000',
        name: 'Selected Day Public Skate',
        startTime: '10:00',
        duration: 60,
        capacity: 200,
        type: 'BOOKABLE' as const,
      },
      {
        id: 'selected-resurface-1100',
        name: 'Selected Day Ice Resurfacing',
        startTime: '11:00',
        duration: 15,
        capacity: 0,
        type: 'OPERATIONAL' as const,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.event.findFirst.mockResolvedValue(event);

    tx.session.findFirst.mockResolvedValue(null);

    tx.session.createMany.mockResolvedValue({
      count: 4,
    });

    tx.operationalSchedule.create.mockResolvedValue(
      createdSchedule,
    );

    prisma.$transaction.mockImplementation(
      async (
        callback: (transaction: typeof tx) => unknown,
      ) => callback(tx),
    );

    service = new OperationalScheduleService(
      prisma as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an operational schedule', async () => {
    const result = await service.createAndGenerate(
      'org-1',
      basePayload,
    );

    expect(
      tx.operationalSchedule.create,
    ).toHaveBeenCalledTimes(1);

    expect(
      tx.operationalSchedule.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Daily Festival Timetable',
        pattern: 'DAILY',
        eventId: 'event-1',
      }),
    });

    expect(result.schedule).toEqual(
      createdSchedule,
    );
  });

  it('should generate bookable sessions for each operating day', async () => {
    const result = await service.createAndGenerate(
      'org-1',
      basePayload,
    );

    expect(result.generatedSessions).toBe(4);

    expect(
      tx.session.createMany,
    ).toHaveBeenCalledTimes(1);

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    expect(createManyCall.data).toHaveLength(4);
  });

  it('should not generate Session records for operational blocks', async () => {
    await service.createAndGenerate(
      'org-1',
      basePayload,
    );

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    const generatedNames = createManyCall.data.map(
      (session: { name: string }) => session.name,
    );

    expect(generatedNames).not.toContain(
      'Ice Resurfacing',
    );

    expect(generatedNames).toEqual([
      'Public Skate',
      'Public Skate',
      'Public Skate',
      'Public Skate',
    ]);
  });

  it('should report operational blocks from the timetable definition', async () => {
    const result = await service.createAndGenerate(
      'org-1',
      basePayload,
    );

    expect(result.operationalBlocks).toBe(1);
  });

  it('should link generated sessions to the operational schedule', async () => {
    await service.createAndGenerate(
      'org-1',
      basePayload,
    );

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    for (const session of createManyCall.data) {
      expect(
        session.operationalScheduleId,
      ).toBe('schedule-1');
    }
  });

  it('should preserve scheduleEntryId on generated sessions', async () => {
    await service.createAndGenerate(
      'org-1',
      basePayload,
    );

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    const scheduleEntryIds =
      createManyCall.data.map(
        (session: {
          scheduleEntryId: string;
        }) => session.scheduleEntryId,
      );

    expect(scheduleEntryIds).toEqual([
      'public-skate-1000',
      'public-skate-1115',
      'public-skate-1000',
      'public-skate-1115',
    ]);
  });

  it('should generate correct session start and end times', async () => {
    await service.createAndGenerate(
      'org-1',
      basePayload,
    );

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    expect(
      createManyCall.data[0].startDate,
    ).toEqual(
      new Date('2027-06-25T00:00:00.000Z'),
    );

    expect(
      createManyCall.data[0].endDate,
    ).toEqual(
      new Date('2027-06-25T01:00:00.000Z'),
    );

    expect(
      createManyCall.data[1].startDate,
    ).toEqual(
      new Date('2027-06-25T01:15:00.000Z'),
    );

    expect(
      createManyCall.data[1].endDate,
    ).toEqual(
      new Date('2027-06-25T02:15:00.000Z'),
    );
  });

  it('should reject a schedule outside the event dates', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        ...basePayload,
        startDate: '2027-06-24',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should reject an end date earlier than the start date', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        ...basePayload,
        startDate: '2027-06-27',
        endDate: '2027-06-26',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should reject an empty timetable', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        ...basePayload,
        timetable: [],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should reject overlapping bookable timetable entries', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        ...basePayload,
        timetable: [
          {
            id: 'session-1',
            name: 'Public Skate',
            startTime: '10:00',
            duration: 60,
            capacity: 200,
            type: 'BOOKABLE',
          },
          {
            id: 'session-2',
            name: 'Learn to Skate',
            startTime: '10:30',
            duration: 60,
            capacity: 50,
            type: 'BOOKABLE',
          },
        ],
      }),
    ).rejects.toThrow(ConflictException);

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should reject conflicts with an existing session', async () => {
    tx.session.findFirst.mockResolvedValue({
      id: 'existing-session-1',
      name: 'Existing Public Skate',
      startDate: new Date(
        '2027-06-25T10:00:00.000Z',
      ),
      endDate: new Date(
        '2027-06-25T11:00:00.000Z',
      ),
    });

    await expect(
      service.createAndGenerate(
        'org-1',
        basePayload,
      ),
    ).rejects.toThrow(ConflictException);

    expect(
      tx.operationalSchedule.create,
    ).not.toHaveBeenCalled();

    expect(
      tx.session.createMany,
    ).not.toHaveBeenCalled();
  });

  it('should not partially generate data when a conflict exists', async () => {
    tx.session.findFirst.mockResolvedValue({
      id: 'existing-session-1',
      name: 'Existing Public Skate',
      startDate: new Date(
        '2027-06-25T10:00:00.000Z',
      ),
      endDate: new Date(
        '2027-06-25T11:00:00.000Z',
      ),
    });

    await expect(
      service.createAndGenerate(
        'org-1',
        basePayload,
      ),
    ).rejects.toThrow(
      'This schedule conflicts with the existing session',
    );

    expect(
      tx.operationalSchedule.create,
    ).not.toHaveBeenCalled();

    expect(
      tx.session.createMany,
    ).not.toHaveBeenCalled();
  });

  it('should use the weekday timetable on weekdays and weekend timetable on weekends', async () => {
    const result = await service.createAndGenerate(
      'org-1',
      weekdayWeekendPayload,
    );

    expect(result.generatedSessions).toBe(6);

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    expect(createManyCall.data).toHaveLength(6);

    expect(
      createManyCall.data.map(
        (session: {
          name: string;
        }) => session.name,
      ),
    ).toEqual([
      'Weekday Public Skate',
      'Weekend Public Skate',
      'Weekend Disco Skate',
      'Weekend Public Skate',
      'Weekend Disco Skate',
      'Weekday Public Skate',
    ]);
  });

  it('should generate weekday and weekend sessions on the correct calendar dates', async () => {
    await service.createAndGenerate(
      'org-1',
      weekdayWeekendPayload,
    );

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    expect(
      createManyCall.data[0].startDate,
    ).toEqual(
      new Date('2027-06-25T00:00:00.000Z'),
    );

    expect(
      createManyCall.data[1].startDate,
    ).toEqual(
      new Date('2027-06-25T23:00:00.000Z'),
    );

    expect(
      createManyCall.data[3].startDate,
    ).toEqual(
      new Date('2027-06-26T23:00:00.000Z'),
    );

    expect(
      createManyCall.data[5].startDate,
    ).toEqual(
      new Date('2027-06-28T00:00:00.000Z'),
    );
  });

  it('should store both weekday and weekend timetable definitions', async () => {
    await service.createAndGenerate(
      'org-1',
      weekdayWeekendPayload,
    );

    expect(
      tx.operationalSchedule.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        pattern: 'WEEKDAY_WEEKEND',
        timetable: {
          weekdayTimetable:
            weekdayWeekendPayload.weekdayTimetable,
          weekendTimetable:
            weekdayWeekendPayload.weekendTimetable,
        },
      }),
    });
  });

  it('should not generate Session records for weekday or weekend operational blocks', async () => {
    const payload = {
      ...weekdayWeekendPayload,
      weekendTimetable: [
        ...weekdayWeekendPayload.weekendTimetable,
        {
          id: 'weekend-resurface-1000',
          name: 'Weekend Ice Resurfacing',
          startTime: '10:00',
          duration: 15,
          capacity: 0,
          type: 'OPERATIONAL' as const,
        },
      ],
    };

    await service.createAndGenerate(
      'org-1',
      payload,
    );

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    const generatedNames =
      createManyCall.data.map(
        (session: {
          name: string;
        }) => session.name,
      );

    expect(generatedNames).not.toContain(
      'Weekday Ice Resurfacing',
    );

    expect(generatedNames).not.toContain(
      'Weekend Ice Resurfacing',
    );
  });

  it('should reject a weekday/weekend schedule with no weekday timetable', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        ...weekdayWeekendPayload,
        weekdayTimetable: [],
      }),
    ).rejects.toThrow(
      'At least one weekday timetable entry is required.',
    );

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should reject a weekday/weekend schedule with no weekend timetable', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        ...weekdayWeekendPayload,
        weekendTimetable: [],
      }),
    ).rejects.toThrow(
      'At least one weekend timetable entry is required.',
    );

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should reject overlapping entries in either weekday or weekend timetable', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        ...weekdayWeekendPayload,
        weekendTimetable: [
          {
            id: 'weekend-session-1',
            name: 'Weekend Public Skate',
            startTime: '10:00',
            duration: 60,
            capacity: 250,
            type: 'BOOKABLE',
          },
          {
            id: 'weekend-session-2',
            name: 'Weekend Disco Skate',
            startTime: '10:30',
            duration: 60,
            capacity: 250,
            type: 'BOOKABLE',
          },
        ],
      }),
    ).rejects.toThrow(ConflictException);

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should generate sessions only on selected weekdays', async () => {
    const result = await service.createAndGenerate(
      'org-1',
      selectedDaysPayload,
    );

    expect(result.generatedSessions).toBe(3);

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    expect(createManyCall.data).toHaveLength(3);

    expect(
      createManyCall.data.map(
        (session: {
          name: string;
        }) => session.name,
      ),
    ).toEqual([
      'Selected Day Public Skate',
      'Selected Day Public Skate',
      'Selected Day Public Skate',
    ]);
  });

  it('should skip unselected weekdays', async () => {
    await service.createAndGenerate(
      'org-1',
      selectedDaysPayload,
    );

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    const startDates =
      createManyCall.data.map(
        (session: {
          startDate: Date;
        }) => session.startDate.toISOString(),
      );

    expect(startDates).toEqual([
      '2027-06-28T00:00:00.000Z',
      '2027-06-30T00:00:00.000Z',
      '2027-07-02T00:00:00.000Z',
    ]);
  });

  it('should store selected days and timetable in the schedule definition', async () => {
    await service.createAndGenerate(
      'org-1',
      selectedDaysPayload,
    );

    expect(
      tx.operationalSchedule.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        pattern: 'SELECTED_DAYS',
        timetable: {
          selectedDays: [1, 3, 5],
          timetable:
            selectedDaysPayload.timetable,
        },
      }),
    });
  });

  it('should preserve event timezone conversion for selected-day sessions', async () => {
    await service.createAndGenerate(
      'org-1',
      {
        ...selectedDaysPayload,
        startDate: '2027-06-28',
        endDate: '2027-06-28',
        selectedDays: [1],
        timetable: [
          {
            id: 'selected-disco-1900',
            name: 'Selected Day Disco Skate',
            startTime: '19:00',
            duration: 60,
            capacity: 300,
            type: 'BOOKABLE',
          },
        ],
      },
    );

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    expect(
      createManyCall.data[0].startDate,
    ).toEqual(
      new Date('2027-06-28T09:00:00.000Z'),
    );

    expect(
      createManyCall.data[0].endDate,
    ).toEqual(
      new Date('2027-06-28T10:00:00.000Z'),
    );
  });

  it('should reject selected-days schedule with no selected days', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        ...selectedDaysPayload,
        selectedDays: [],
      }),
    ).rejects.toThrow(
      'At least one day must be selected.',
    );

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should reject invalid selected day numbers', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        ...selectedDaysPayload,
        selectedDays: [1, 3, 7],
      }),
    ).rejects.toThrow(
      'Selected days must be numbers from 0 to 6.',
    );

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should reject duplicate selected days', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        ...selectedDaysPayload,
        selectedDays: [1, 3, 3, 5],
      }),
    ).rejects.toThrow(
      'Selected days must not contain duplicates.',
    );

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should not generate Session records for selected-day operational blocks', async () => {
    await service.createAndGenerate(
      'org-1',
      selectedDaysPayload,
    );

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    const generatedNames =
      createManyCall.data.map(
        (session: {
          name: string;
        }) => session.name,
      );

    expect(generatedNames).not.toContain(
      'Selected Day Ice Resurfacing',
    );

    expect(
      createManyCall.data,
    ).toHaveLength(3);
  });
    it('should generate sessions only on exact manual dates', async () => {
    const manualPayload = {
      eventId: 'event-1',
      name: 'Manual Festival Timetable',
      pattern: 'MANUAL',
      startDate: '2027-07-05',
      endDate: '2027-07-10',
      manualDays: [
        {
          date: '2027-07-05',
          timetable: [
            {
              id: 'manual-public-1000',
              name: 'Manual Public Skate',
              startTime: '10:00',
              duration: 60,
              capacity: 200,
              type: 'BOOKABLE' as const,
            },
          ],
        },
        {
          date: '2027-07-08',
          timetable: [
            {
              id: 'manual-disco-1900',
              name: 'Manual Disco Skate',
              startTime: '19:00',
              duration: 60,
              capacity: 300,
              type: 'BOOKABLE' as const,
            },
          ],
        },
      ],
    };

    const result = await service.createAndGenerate(
      'org-1',
      manualPayload,
    );

    expect(result.generatedSessions).toBe(2);

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    expect(createManyCall.data).toHaveLength(2);

    expect(
      createManyCall.data.map(
        (session: { name: string }) => session.name,
      ),
    ).toEqual([
      'Manual Public Skate',
      'Manual Disco Skate',
    ]);
  });

  it('should support different timetables on different manual dates', async () => {
    const manualPayload = {
      eventId: 'event-1',
      name: 'Manual Festival Timetable',
      pattern: 'MANUAL',
      startDate: '2027-07-05',
      endDate: '2027-07-10',
      manualDays: [
        {
          date: '2027-07-05',
          timetable: [
            {
              id: 'manual-public-1000',
              name: 'Morning Public Skate',
              startTime: '10:00',
              duration: 60,
              capacity: 200,
              type: 'BOOKABLE' as const,
            },
          ],
        },
        {
          date: '2027-07-08',
          timetable: [
            {
              id: 'manual-disco-1900',
              name: 'Evening Disco Skate',
              startTime: '19:00',
              duration: 90,
              capacity: 300,
              type: 'BOOKABLE' as const,
            },
          ],
        },
      ],
    };

    await service.createAndGenerate(
      'org-1',
      manualPayload,
    );

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    expect(createManyCall.data[0].name).toBe(
      'Morning Public Skate',
    );

    expect(createManyCall.data[1].name).toBe(
      'Evening Disco Skate',
    );

    expect(createManyCall.data[0].capacity).toBe(200);
    expect(createManyCall.data[1].capacity).toBe(300);
  });

  it('should store manual days in the schedule definition', async () => {
    const manualDays = [
      {
        date: '2027-07-05',
        timetable: [
          {
            id: 'manual-public-1000',
            name: 'Manual Public Skate',
            startTime: '10:00',
            duration: 60,
            capacity: 200,
            type: 'BOOKABLE' as const,
          },
        ],
      },
    ];

    await service.createAndGenerate('org-1', {
      eventId: 'event-1',
      name: 'Manual Festival Timetable',
      pattern: 'MANUAL',
      startDate: '2027-07-05',
      endDate: '2027-07-10',
      manualDays,
    });

    expect(
      tx.operationalSchedule.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        pattern: 'MANUAL',
        timetable: {
          manualDays,
        },
      }),
    });
  });

  it('should not generate Session records for manual operational blocks', async () => {
    const result = await service.createAndGenerate(
      'org-1',
      {
        eventId: 'event-1',
        name: 'Manual Festival Timetable',
        pattern: 'MANUAL',
        startDate: '2027-07-05',
        endDate: '2027-07-05',
        manualDays: [
          {
            date: '2027-07-05',
            timetable: [
              {
                id: 'manual-public-1000',
                name: 'Manual Public Skate',
                startTime: '10:00',
                duration: 60,
                capacity: 200,
                type: 'BOOKABLE',
              },
              {
                id: 'manual-resurface-1100',
                name: 'Manual Ice Resurfacing',
                startTime: '11:00',
                duration: 15,
                capacity: 0,
                type: 'OPERATIONAL',
              },
            ],
          },
        ],
      },
    );

    expect(result.generatedSessions).toBe(1);
    expect(result.operationalBlocks).toBe(1);

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    expect(createManyCall.data).toHaveLength(1);

    expect(
      createManyCall.data[0].name,
    ).toBe('Manual Public Skate');
  });

  it('should preserve event timezone conversion for manual sessions', async () => {
    await service.createAndGenerate(
      'org-1',
      {
        eventId: 'event-1',
        name: 'Manual Festival Timetable',
        pattern: 'MANUAL',
        startDate: '2027-07-05',
        endDate: '2027-07-05',
        manualDays: [
          {
            date: '2027-07-05',
            timetable: [
              {
                id: 'manual-disco-1900',
                name: 'Manual Disco Skate',
                startTime: '19:00',
                duration: 60,
                capacity: 300,
                type: 'BOOKABLE',
              },
            ],
          },
        ],
      },
    );

    const createManyCall =
      tx.session.createMany.mock.calls[0][0];

    expect(
      createManyCall.data[0].startDate,
    ).toEqual(
      new Date('2027-07-05T09:00:00.000Z'),
    );

    expect(
      createManyCall.data[0].endDate,
    ).toEqual(
      new Date('2027-07-05T10:00:00.000Z'),
    );
  });

  it('should reject a manual schedule with no manual days', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        eventId: 'event-1',
        name: 'Manual Festival Timetable',
        pattern: 'MANUAL',
        startDate: '2027-07-05',
        endDate: '2027-07-10',
        manualDays: [],
      }),
    ).rejects.toThrow(
      'At least one manual schedule day is required.',
    );

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should reject a manual date outside the schedule range', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        eventId: 'event-1',
        name: 'Manual Festival Timetable',
        pattern: 'MANUAL',
        startDate: '2027-07-05',
        endDate: '2027-07-10',
        manualDays: [
          {
            date: '2027-07-11',
            timetable: [
              {
                id: 'manual-public-1000',
                name: 'Manual Public Skate',
                startTime: '10:00',
                duration: 60,
                capacity: 200,
                type: 'BOOKABLE',
              },
            ],
          },
        ],
      }),
    ).rejects.toThrow(
      'must remain within the schedule date range',
    );

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should reject duplicate manual dates', async () => {
    const manualDay = {
      date: '2027-07-05',
      timetable: [
        {
          id: 'manual-public-1000',
          name: 'Manual Public Skate',
          startTime: '10:00',
          duration: 60,
          capacity: 200,
          type: 'BOOKABLE' as const,
        },
      ],
    };

    await expect(
      service.createAndGenerate('org-1', {
        eventId: 'event-1',
        name: 'Manual Festival Timetable',
        pattern: 'MANUAL',
        startDate: '2027-07-05',
        endDate: '2027-07-10',
        manualDays: [
          manualDay,
          manualDay,
        ],
      }),
    ).rejects.toThrow(
      'Manual schedule date "2027-07-05" is duplicated.',
    );

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it('should reject a manual day with an empty timetable', async () => {
    await expect(
      service.createAndGenerate('org-1', {
        eventId: 'event-1',
        name: 'Manual Festival Timetable',
        pattern: 'MANUAL',
        startDate: '2027-07-05',
        endDate: '2027-07-10',
        manualDays: [
          {
            date: '2027-07-05',
            timetable: [],
          },
        ],
      }),
    ).rejects.toThrow(
      'Manual schedule date "2027-07-05" requires at least one timetable entry.',
    );

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });
});