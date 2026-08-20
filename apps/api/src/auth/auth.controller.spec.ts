import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const serviceMock = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes validated credentials to the authentication service', async () => {
    const credentials = {
      email: 'operator@example.com',
      password: 'correct horse battery staple',
    };
    const result = {
      accessToken: 'signed-token',
      user: {
        id: 'user-1',
      },
    };

    serviceMock.login.mockResolvedValue(result);

    await expect(controller.login(credentials)).resolves.toEqual(result);
    expect(serviceMock.login).toHaveBeenCalledWith(credentials);
  });

  it('returns only the claims supplied by the authenticated request', () => {
    const user = {
      userId: 'user-1',
      email: 'operator@example.com',
      role: 'OWNER',
      organizationId: 'organization-1',
    };

    expect(controller.me(user)).toEqual(user);
  });
});
