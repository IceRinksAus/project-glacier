import { Test, TestingModule } from '@nestjs/testing';

import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  const serviceMock = {
    findCurrent: jest.fn(),
    addUser: jest.fn(),
  };
  const user = {
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
      { userId: 'user-1', role: 'MEMBER' },
      user,
    );

    expect(serviceMock.addUser).toHaveBeenCalledWith(
      'organization-1',
      'organization-1',
      { userId: 'user-1', role: 'MEMBER' },
    );
  });
});
