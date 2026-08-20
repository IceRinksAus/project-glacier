import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { RuleService } from './rule.service';

describe('RuleService', () => {
  let service: RuleService;

  const prismaMock = {
    event: {
      findFirst: jest.fn(),
    },
    rule: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<RuleService>(RuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('tenant-scopes Rule lists through the Event', async () => {
    prismaMock.rule.findMany.mockResolvedValue([]);

    await service.findAll('organization-1');

    expect(prismaMock.rule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          event: {
            organizationId: 'organization-1',
          },
        },
      }),
    );
  });

  it('does not create a Rule for another tenant Event', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);

    await expect(
      service.create('organization-1', {
        eventId: 'event-2',
        name: 'Rule',
        slug: 'rule',
        ruleType: 'ELIGIBILITY',
        conditions: {},
        actions: {},
      }),
    ).rejects.toThrow('Event not found.');
    expect(prismaMock.rule.create).not.toHaveBeenCalled();
  });

  it('does not update a Rule outside the authenticated organization', async () => {
    prismaMock.rule.findFirst.mockResolvedValue(null);

    await expect(
      service.update('organization-1', 'rule-2', {
        name: 'Changed',
      }),
    ).rejects.toThrow('Rule not found.');
    expect(prismaMock.rule.update).not.toHaveBeenCalled();
  });

  it('updates a tenant-owned Rule without allowing Event reassignment', async () => {
    prismaMock.rule.findFirst
      .mockResolvedValueOnce({
        id: 'rule-1',
        eventId: 'event-1',
        slug: 'original-rule',
      })
      .mockResolvedValueOnce(null);
    prismaMock.rule.update.mockResolvedValue({ id: 'rule-1' });

    await service.update('organization-1', 'rule-1', {
      name: 'Changed',
      slug: 'changed-rule',
    });

    expect(prismaMock.rule.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'rule-1',
        event: {
          organizationId: 'organization-1',
        },
      },
    });
    expect(prismaMock.rule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          eventId: expect.anything(),
        }),
      }),
    );
  });

  it('tenant-scopes Rule deletion', async () => {
    prismaMock.rule.findFirst.mockResolvedValue(null);

    await expect(service.remove('organization-1', 'rule-2')).rejects.toThrow(
      'Rule not found.',
    );
    expect(prismaMock.rule.delete).not.toHaveBeenCalled();
  });
});
