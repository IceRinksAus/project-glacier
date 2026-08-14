import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;

  const event = {
    id: 'event-1',
    name: 'Australian Ice Festival 2027',
    startDate: new Date(
      '2027-06-25T00:00:00.000Z',
    ),
    endDate: new Date(
      '2027-07-18T23:59:59.999Z',
    ),
    timezone: 'Australia/Melbourne',
    organizationId: 'org-1',
  };

  const existingSession = {
    id: 'session-1',
    name: 'Public Skate',
    startDate: new Date(
      '2027-07-05T00:00:00.000Z',
    ),
    endDate: new Date(
      '2027-07-05T01:00:00.000Z',
    ),
    capacity: 200,
    status: 'DRAFT',
    salesStart: null,
    salesEnd: null,
    eventId: 'event-1',
    operationalScheduleId: 'schedule-1',
    scheduleEntryId: 'public-skate-1000',
    scheduleExceptionType: 'NONE',
    createdAt: new Date(
      '2026-08-11T00:00:00.000Z',
    ),
    updatedAt: new Date(
      '2026-08-11T00:00:00.000Z',
    ),
    event,
  };

const prisma = {
  event: {
    findFirst: jest.fn(),
  },
  bookingItem: {
    aggregate: jest.fn(),
  },
  session: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.event.findFirst.mockResolvedValue(
      event,
    );
    prisma.bookingItem.aggregate.mockResolvedValue({
  _sum: {
    quantity: 0,
  },
});

  prisma.session.findFirst.mockImplementation(
  async (args: {
    where?: {
      id?: string | {
        not?: string;
      };
    };
  }) => {
    if (
      typeof args?.where?.id === "object" &&
      args.where.id?.not
    ) {
      return null;
    }

    return existingSession;
  },
);

    prisma.session.create.mockResolvedValue(
      existingSession,
    );

    prisma.session.update.mockResolvedValue(
      existingSession,
    );

    prisma.session.delete.mockResolvedValue(
      existingSession,
    );

    prisma.session.findMany.mockResolvedValue([
      existingSession,
    ]);

    service = new SessionService(
      prisma as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a session for an event owned by the organization', async () => {
    await service.create('org-1', {
      eventId: 'event-1',
      name: '  Public Skate  ',
      startDate:
        '2027-07-05T00:00:00.000Z',
      endDate:
        '2027-07-05T01:00:00.000Z',
      capacity: 200,
    });

    expect(
      prisma.event.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        id: 'event-1',
        organizationId: 'org-1',
      },
    });

    expect(
      prisma.session.create,
    ).toHaveBeenCalledWith({
      data: {
        name: 'Public Skate',
        startDate: new Date(
          '2027-07-05T00:00:00.000Z',
        ),
        endDate: new Date(
          '2027-07-05T01:00:00.000Z',
        ),
        capacity: 200,
        status: 'DRAFT',
        salesStart: null,
        salesEnd: null,
        eventId: 'event-1',
      },
      include: {
        event: true,
      },
    });
  });

  it('should use the supplied session status when creating a session', async () => {
    await service.create('org-1', {
      eventId: 'event-1',
      name: 'Public Skate',
      startDate:
        '2027-07-05T00:00:00.000Z',
      endDate:
        '2027-07-05T01:00:00.000Z',
      capacity: 200,
      status: 'ACTIVE',
    });

    expect(
      prisma.session.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ACTIVE',
        }),
      }),
    );
  });

  it('should reject session creation when the event is not owned by the organization', async () => {
    prisma.event.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      service.create('org-2', {
        eventId: 'event-1',
        name: 'Public Skate',
        startDate:
          '2027-07-05T00:00:00.000Z',
        endDate:
          '2027-07-05T01:00:00.000Z',
        capacity: 200,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(
      prisma.session.create,
    ).not.toHaveBeenCalled();
  });

  it('should reject a session whose end is not later than its start', async () => {
    await expect(
      service.create('org-1', {
        eventId: 'event-1',
        name: 'Public Skate',
        startDate:
          '2027-07-05T01:00:00.000Z',
        endDate:
          '2027-07-05T01:00:00.000Z',
        capacity: 200,
      }),
    ).rejects.toThrow(
      'Session end date must be later than the start date.',
    );

    expect(
      prisma.session.create,
    ).not.toHaveBeenCalled();
  });

  it('should reject a session outside the event dates', async () => {
    await expect(
      service.create('org-1', {
        eventId: 'event-1',
        name: 'Public Skate',
        startDate:
          '2027-07-19T00:00:00.000Z',
        endDate:
          '2027-07-19T01:00:00.000Z',
        capacity: 200,
      }),
    ).rejects.toThrow(
      'The session must occur within the event start and end dates.',
    );

    expect(
      prisma.session.create,
    ).not.toHaveBeenCalled();
  });

  it('should reject an invalid sales window when creating a session', async () => {
    await expect(
      service.create('org-1', {
        eventId: 'event-1',
        name: 'Public Skate',
        startDate:
          '2027-07-05T00:00:00.000Z',
        endDate:
          '2027-07-05T01:00:00.000Z',
        capacity: 200,
        salesStart:
          '2027-06-20T10:00:00.000Z',
        salesEnd:
          '2027-06-20T09:00:00.000Z',
      }),
    ).rejects.toThrow(
      'Sales end date must be later than the sales start date.',
    );

    expect(
      prisma.session.create,
    ).not.toHaveBeenCalled();
  });

  it('should find sessions belonging to the organization and event', async () => {
    const result = await service.findAll(
      'org-1',
      'event-1',
    );

    expect(
      prisma.session.findMany,
    ).toHaveBeenCalledWith({
      where: {
        eventId: 'event-1',
        event: {
          organizationId: 'org-1',
        },
      },
      include: {
        event: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    expect(result).toEqual([
      existingSession,
    ]);
  });

  it('should find an organization-owned session by id', async () => {
    const result = await service.findOne(
      'session-1',
      'org-1',
    );

    expect(
      prisma.session.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        event: {
          organizationId: 'org-1',
        },
      },
      include: {
        event: true,
        bookings: {
          include: {
            customer: true,
            items: {
              include: {
                ticketType: true,
              },
            },
          },
        },
      },
    });

    expect(result).toEqual(
      existingSession,
    );
  });

  it('should reject access to a session that is not available to the organization', async () => {
    prisma.session.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      service.findOne(
        'session-1',
        'org-2',
      ),
    ).rejects.toThrow(
      'Session not found.',
    );
  });

  it('should update session name and capacity while preserving unchanged fields', async () => {
    prisma.session.update.mockResolvedValue({
      ...existingSession,
      name: 'Evening Public Skate',
      capacity: 250,
    });

    await service.update(
      'session-1',
      'org-1',
      {
        name: '  Evening Public Skate  ',
        capacity: 250,
      },
    );

    expect(
      prisma.session.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
      },
      data: {
        name: 'Evening Public Skate',
        startDate:
          existingSession.startDate,
        endDate:
          existingSession.endDate,
        capacity: 250,
        status:
          existingSession.status,
        salesStart:
          existingSession.salesStart,
        salesEnd:
          existingSession.salesEnd,
        scheduleExceptionType: 'MODIFIED',
      },
      include: {
        event: true,
      },
    });
  });

  it('should reject an update whose end is not later than its start', async () => {
    await expect(
      service.update(
        'session-1',
        'org-1',
        {
          startDate:
            '2027-07-05T02:00:00.000Z',
          endDate:
            '2027-07-05T01:00:00.000Z',
        },
      ),
    ).rejects.toThrow(
      BadRequestException,
    );

    expect(
      prisma.session.update,
    ).not.toHaveBeenCalled();
  });

  it('should reject an update outside the event dates', async () => {
    await expect(
      service.update(
        'session-1',
        'org-1',
        {
          startDate:
            '2027-07-19T00:00:00.000Z',
          endDate:
            '2027-07-19T01:00:00.000Z',
        },
      ),
    ).rejects.toThrow(
      'The session must occur within the event start and end dates.',
    );

    expect(
      prisma.session.update,
    ).not.toHaveBeenCalled();
  });

  it('should reject an invalid sales window when updating a session', async () => {
    await expect(
      service.update(
        'session-1',
        'org-1',
        {
          salesStart:
            '2027-06-20T10:00:00.000Z',
          salesEnd:
            '2027-06-20T09:00:00.000Z',
        },
      ),
    ).rejects.toThrow(
      'Sales end date must be later than the sales start date.',
    );

    expect(
      prisma.session.update,
    ).not.toHaveBeenCalled();
  });

  it('should delete a session with no bookings', async () => {
    prisma.session.findFirst.mockResolvedValue({
      ...existingSession,
      bookings: [],
    });

    await service.remove(
      'session-1',
      'org-1',
    );

    expect(
      prisma.session.delete,
    ).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
      },
    });
  });

  it('should reject deletion when the session has bookings', async () => {
    prisma.session.findFirst.mockResolvedValue({
      ...existingSession,
      bookings: [
        {
          id: 'booking-1',
        },
      ],
    });

    await expect(
      service.remove(
        'session-1',
        'org-1',
      ),
    ).rejects.toThrow(
      'This session cannot be deleted because it has bookings.',
    );

    expect(
      prisma.session.delete,
    ).not.toHaveBeenCalled();
  });

  it('should reject deletion when the session is not available to the organization', async () => {
    prisma.session.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      service.remove(
        'session-1',
        'org-2',
      ),
    ).rejects.toThrow(
      'Session not found.',
    );

    expect(
      prisma.session.delete,
    ).not.toHaveBeenCalled();
  });
  it('should reject an update that overlaps another session', async () => {
  prisma.session.findFirst
    .mockResolvedValueOnce(existingSession)
    .mockResolvedValueOnce({
      id: 'session-2',
      name: 'Learn to Skate',
      startDate: new Date(
        '2027-07-05T01:15:00.000Z',
      ),
      endDate: new Date(
        '2027-07-05T02:15:00.000Z',
      ),
    });

  await expect(
    service.update(
      'session-1',
      'org-1',
      {
        startDate:
          '2027-07-05T00:30:00.000Z',
        endDate:
          '2027-07-05T01:30:00.000Z',
      },
    ),
  ).rejects.toThrow(
    'This session conflicts with the existing session "Learn to Skate"',
  );

  expect(
    prisma.session.update,
  ).not.toHaveBeenCalled();
});

it('should allow an update that finishes exactly when another session starts', async () => {
  prisma.session.findFirst
    .mockResolvedValueOnce(existingSession)
    .mockResolvedValueOnce(null);

  prisma.session.update.mockResolvedValue({
    ...existingSession,
    startDate: new Date(
      '2027-07-05T00:15:00.000Z',
    ),
    endDate: new Date(
      '2027-07-05T01:15:00.000Z',
    ),
  });

  await service.update(
    'session-1',
    'org-1',
    {
      startDate:
        '2027-07-05T00:15:00.000Z',
      endDate:
        '2027-07-05T01:15:00.000Z',
    },
  );

  expect(
    prisma.session.update,
  ).toHaveBeenCalledTimes(1);
});
it('should reject capacity below the occupied session quantity', async () => {
  prisma.session.findFirst.mockResolvedValue(
    existingSession,
  );

  prisma.bookingItem = {
    aggregate: jest.fn().mockResolvedValue({
      _sum: {
        quantity: 47,
      },
    }),
  };

  await expect(
    service.update(
      'session-1',
      'org-1',
      {
        capacity: 46,
      },
    ),
  ).rejects.toThrow(
    'Session capacity cannot be lower than the currently booked quantity of 47.',
  );

  expect(
    prisma.session.update,
  ).not.toHaveBeenCalled();
});

it('should allow capacity equal to the occupied session quantity', async () => {
  prisma.session.findFirst.mockImplementation(
    async (args: {
      where?: {
        id?: string | {
          not?: string;
        };
      };
    }) => {
      if (
        typeof args?.where?.id === "object" &&
        args.where.id?.not
      ) {
        return null;
      }

      return existingSession;
    },
  );

  prisma.bookingItem = {
    aggregate: jest.fn().mockResolvedValue({
      _sum: {
        quantity: 47,
      },
    }),
  };

  await service.update(
    'session-1',
    'org-1',
    {
      capacity: 47,
    },
  );

  expect(
    prisma.session.update,
  ).toHaveBeenCalledTimes(1);
});

it('should treat an unoccupied session as having zero booked quantity', async () => {
  prisma.session.findFirst.mockImplementation(
    async (args: {
      where?: {
        id?: string | {
          not?: string;
        };
      };
    }) => {
      if (
        typeof args?.where?.id === "object" &&
        args.where.id?.not
      ) {
        return null;
      }

      return existingSession;
    },
  );

  prisma.bookingItem = {
    aggregate: jest.fn().mockResolvedValue({
      _sum: {
        quantity: null,
      },
    }),
  };

  await service.update(
    'session-1',
    'org-1',
    {
      capacity: 1,
    },
  );

  expect(
    prisma.session.update,
  ).toHaveBeenCalledTimes(1);
});
it('should mark a generated session as modified when edited', async () => {
  prisma.session.findFirst.mockResolvedValue(
    existingSession,
  );

  prisma.session.update.mockResolvedValue({
    ...existingSession,
    name: 'Updated Public Skate',
    scheduleExceptionType: 'MODIFIED',
  });

  await service.update(
    'session-1',
    'org-1',
    {
      name: 'Updated Public Skate',
    },
  );

  expect(
    prisma.session.update,
  ).toHaveBeenCalledWith({
    where: {
      id: 'session-1',
    },
    data: expect.objectContaining({
      name: 'Updated Public Skate',
      scheduleExceptionType: 'MODIFIED',
    }),
    include: {
      event: true,
    },
  });
});

it('should leave a standalone session without a schedule exception when edited', async () => {
  const standaloneSession = {
    ...existingSession,
    id: 'standalone-session-1',
    operationalScheduleId: null,
    scheduleEntryId: null,
    scheduleExceptionType: 'NONE',
  };

  prisma.session.findFirst.mockResolvedValue(
    standaloneSession,
  );

  prisma.session.update.mockResolvedValue({
    ...standaloneSession,
    name: 'Updated Standalone Session',
  });

  await service.update(
    'standalone-session-1',
    'org-1',
    {
      name: 'Updated Standalone Session',
    },
  );

  expect(
    prisma.session.update,
  ).toHaveBeenCalledWith({
    where: {
      id: 'standalone-session-1',
    },
    data: expect.objectContaining({
      name: 'Updated Standalone Session',
      scheduleExceptionType: 'NONE',
    }),
    include: {
      event: true,
    },
  });
});
it('should cancel a generated session and mark it as a cancelled schedule exception', async () => {
  prisma.session.findFirst.mockResolvedValue(
    existingSession,
  );

  prisma.session.update.mockResolvedValue({
    ...existingSession,
    status: 'CANCELLED',
    scheduleExceptionType: 'CANCELLED',
  });

  await service.cancel(
    'session-1',
    'org-1',
  );

  expect(
    prisma.session.update,
  ).toHaveBeenCalledWith({
    where: {
      id: 'session-1',
    },
    data: {
      status: 'CANCELLED',
      scheduleExceptionType: 'CANCELLED',
    },
    include: {
      event: true,
    },
  });
});

it('should cancel a standalone session without creating a schedule exception', async () => {
  const standaloneSession = {
    ...existingSession,
    id: 'standalone-session-1',
    operationalScheduleId: null,
    scheduleEntryId: null,
    scheduleExceptionType: 'NONE',
  };

  prisma.session.findFirst.mockResolvedValue(
    standaloneSession,
  );

  prisma.session.update.mockResolvedValue({
    ...standaloneSession,
    status: 'CANCELLED',
  });

  await service.cancel(
    'standalone-session-1',
    'org-1',
  );

  expect(
    prisma.session.update,
  ).toHaveBeenCalledWith({
    where: {
      id: 'standalone-session-1',
    },
    data: {
      status: 'CANCELLED',
      scheduleExceptionType: 'NONE',
    },
    include: {
      event: true,
    },
  });
});

it('should reject cancellation when the session is not available to the organization', async () => {
  prisma.session.findFirst.mockResolvedValue(
    null,
  );

  await expect(
    service.cancel(
      'session-1',
      'org-2',
    ),
  ).rejects.toThrow(
    'Session not found.',
  );

  expect(
    prisma.session.update,
  ).not.toHaveBeenCalled();
});
it('should reject cancellation through the generic update path', async () => {
  await expect(
    service.update(
      'session-1',
      'org-1',
      {
        status: 'CANCELLED',
      },
    ),
  ).rejects.toThrow(
    'Use the dedicated cancellation action to cancel a session.',
  );

  expect(
    prisma.session.update,
  ).not.toHaveBeenCalled();
});
});