import { Test, TestingModule } from '@nestjs/testing';

import { EventController } from './event.controller';
import { EventService } from './event.service';
import { FileAssetService } from '../file-asset/file-asset.service';

describe('EventController', () => {
  let controller: EventController;

  const serviceMock = {
    getReadiness: jest.fn(),
    updateEntryPolicy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: EventService,
          useValue: serviceMock,
        },
        {
          provide: FileAssetService,
          useValue: { createBrandingAsset: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<EventController>(EventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uses trusted organization context for entry policy updates', async () => {
    const data = {
      entryOpensMinutesBeforeStart: 30,
      entryClosesMinutesAfterEnd: 10,
    };
    await controller.updateEntryPolicy(
      'event-1',
      {
        userId: 'user-1',
        email: 'owner@example.com',
        role: 'OWNER',
        organizationId: 'organization-1',
      },
      data,
    );
    expect(serviceMock.updateEntryPolicy).toHaveBeenCalledWith(
      'event-1',
      'organization-1',
      data,
    );
  });

  it('uses trusted organization context for readiness', async () => {
    await controller.getReadiness('event-1', {
      userId: 'user-1',
      email: 'member@example.com',
      role: 'MEMBER',
      organizationId: 'organization-1',
    });

    expect(serviceMock.getReadiness).toHaveBeenCalledWith(
      'event-1',
      'organization-1',
    );
  });
});
