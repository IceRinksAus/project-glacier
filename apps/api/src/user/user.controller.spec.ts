import { Test, TestingModule } from '@nestjs/testing';

import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  const serviceMock = {
    findAll: jest.fn(),
    create: jest.fn(),
  };
  const user = {
    organizationId: 'organization-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get(UserController);
  });

  it('uses trusted organization context for reads', async () => {
    serviceMock.findAll.mockResolvedValue([]);

    await controller.findAll(user);

    expect(serviceMock.findAll).toHaveBeenCalledWith('organization-1');
  });

  it('does not accept organization identity in the create payload', async () => {
    const data = {
      email: 'member@example.com',
      name: 'Member User',
      password: 'secure-password',
      role: 'MEMBER' as const,
    };
    serviceMock.create.mockResolvedValue({ id: 'user-1' });

    await controller.create(data, user);

    expect(serviceMock.create).toHaveBeenCalledWith('organization-1', data);
  });
});
