import { Test, TestingModule } from '@nestjs/testing';

import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { EventGroupController } from './event-group.controller';
import { EventGroupService } from './event-group.service';

describe('EventGroupController', () => {
  let controller: EventGroupController;
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    replaceEvents: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventGroupController],
      providers: [{ provide: EventGroupService, useValue: service }],
    }).compile();
    controller = module.get(EventGroupController);
  });

  it('uses trusted Organisation context for Group reads', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll({ organizationId: 'org-1' });
    expect(service.findAll).toHaveBeenCalledWith('org-1');
  });

  it('allows OWNER and MEMBER reads at the controller boundary', () => {
    expect(Reflect.getMetadata(ROLES_KEY, EventGroupController)).toEqual([
      'OWNER',
      'MEMBER',
    ]);
  });

  it('restricts Group creation and membership mutation to OWNER', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, EventGroupController.prototype.create),
    ).toEqual(['OWNER']);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        EventGroupController.prototype.replaceEvents,
      ),
    ).toEqual(['OWNER']);
  });
});
