import { Test, TestingModule } from '@nestjs/testing';

import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  const serviceMock = {
    findCurrent: jest.fn(),
    listTeam: jest.fn(),
    updateTeamAccess: jest.fn(),
    addUser: jest.fn(),
  };
  const user = {
    userId: 'owner-1',
    organizationId: 'organization-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get(OrganizationController);
  });

  it('uses trusted organization context for reads', async () => {
    serviceMock.findCurrent.mockResolvedValue({ id: 'organization-1' });

    await controller.findCurrent(user);

    expect(serviceMock.findCurrent).toHaveBeenCalledWith('organization-1');
  });

  it('uses trusted organization context for membership mutation', async () => {
    serviceMock.addUser.mockResolvedValue({ id: 'membership-1' });

    await controller.addUser(
      'organization-1',
      { userId: 'user-1', role: 'STAFF' },
      user,
    );

    expect(serviceMock.addUser).toHaveBeenCalledWith(
      'organization-1',
      'organization-1',
      'owner-1',
      { userId: 'user-1', role: 'STAFF' },
    );
  });

  it('uses trusted actor and organization context for access updates', async () => {
    serviceMock.updateTeamAccess.mockResolvedValue({ id: 'membership-1' });

    await controller.updateTeamAccess(
      'user-1',
      {
        role: 'MANAGER',
        accessScope: 'ASSIGNED_EVENTS',
        eventIds: ['event-1'],
      },
      user,
    );

    expect(serviceMock.updateTeamAccess).toHaveBeenCalledWith(
      'organization-1',
      'owner-1',
      'user-1',
      {
        role: 'MANAGER',
        accessScope: 'ASSIGNED_EVENTS',
        eventIds: ['event-1'],
      },
    );
  });
});
