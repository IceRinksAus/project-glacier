import { Test, TestingModule } from '@nestjs/testing';

import { RuleController } from './rule.controller';
import { RuleService } from './rule.service';

describe('RuleController', () => {
  let controller: RuleController;
  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const user = {
    organizationId: 'organization-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RuleController],
      providers: [
        {
          provide: RuleService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get(RuleController);
  });

  it('uses trusted organization context for reads', async () => {
    serviceMock.findAll.mockResolvedValue([]);

    await controller.findAll(user);

    expect(serviceMock.findAll).toHaveBeenCalledWith('organization-1');
  });

  it('uses trusted organization context for mutation', async () => {
    const data = {
      eventId: 'event-1',
      name: 'Rule',
      slug: 'rule',
      ruleType: 'ELIGIBILITY',
      conditions: {},
      actions: {},
    };
    serviceMock.create.mockResolvedValue({ id: 'rule-1' });

    await controller.create(data, user);

    expect(serviceMock.create).toHaveBeenCalledWith('organization-1', data);
  });
});
