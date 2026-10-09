import { RuleEngineService } from './rule-engine.service';

describe('RuleEngineService', () => {
  const prisma = {
    rule: {
      findMany: jest.fn(),
    },
  };

  let service: RuleEngineService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RuleEngineService(prisma as never);
    prisma.rule.findMany.mockResolvedValue([
      {
        id: 'rule-young-child-adult',
        name: 'Young Child requires Adult',
        status: 'ACTIVE',
        priority: 200,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        conditions: {
          all: [
            {
              field: 'ticketTypeId',
              operator: 'EQUALS',
              value: 'ticket-young-child',
            },
            {
              field: 'bookingTicketTypeIds',
              operator: 'NOT_CONTAINS',
              value: 'ticket-adult',
            },
          ],
        },
        actions: { type: 'BLOCK_BOOKING' },
        message:
          'Young Child requires at least one Adult Ticket in the same booking.',
        stopProcessing: false,
      },
    ]);
  });

  it('blocks a dependent Ticket when its companion Ticket is absent', async () => {
    const result = await service.evaluate('event-1', {
      ticketTypeId: 'ticket-young-child',
      bookingTicketTypeIds: ['ticket-young-child'],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      'Young Child requires at least one Adult Ticket in the same booking.',
    ]);
  });

  it('allows a dependent Ticket when its companion Ticket is present', async () => {
    const result = await service.evaluate('event-1', {
      ticketTypeId: 'ticket-young-child',
      bookingTicketTypeIds: ['ticket-young-child', 'ticket-adult'],
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
