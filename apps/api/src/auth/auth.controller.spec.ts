import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const serviceMock = {
    login: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllSessions: jest.fn(),
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
      sessionId: 'session-1',
      email: 'operator@example.com',
      role: 'OWNER',
      organizationId: 'organization-1',
    };

    expect(controller.me(user)).toEqual({
      userId: 'user-1',
      email: 'operator@example.com',
      role: 'OWNER',
      organizationId: 'organization-1',
    });
  });

  it('revokes the current or all authenticated sessions', async () => {
    const user = {
      userId: 'user-1',
      sessionId: 'session-1',
      email: 'operator@example.com',
      role: 'OWNER',
      organizationId: 'organization-1',
    };
    serviceMock.revokeSession.mockResolvedValue({ revoked: true });
    serviceMock.revokeAllSessions.mockResolvedValue({ revoked: true });

    await expect(controller.logout(user)).resolves.toEqual({ revoked: true });
    await expect(controller.logoutAll(user)).resolves.toEqual({
      revoked: true,
    });
    expect(serviceMock.revokeSession).toHaveBeenCalledWith(
      'user-1',
      'session-1',
    );
    expect(serviceMock.revokeAllSessions).toHaveBeenCalledWith('user-1');
  });
});
