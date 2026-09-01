import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
} from '@nestjs/common';
import { lastValueFrom, throwError } from 'rxjs';

import { RequestFailureInterceptor } from './request-failure.interceptor';

describe('RequestFailureInterceptor', () => {
  it('records correlated safe failure evidence and preserves the exception', async () => {
    const interceptor = new RequestFailureInterceptor();
    const logger = (interceptor as unknown as { logger: { warn: jest.Mock } })
      .logger;
    jest.spyOn(logger, 'warn').mockImplementation();
    const exception = new BadRequestException(
      'customer@example.com supplied a private-ticket-token',
    );
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          requestId: 'request-123',
          method: 'POST',
          baseUrl: '/public/bookings',
          route: { path: '/:bookingId/payment' },
        }),
      }),
    } as ExecutionContext;
    const next = {
      handle: () => throwError(() => exception),
    } as CallHandler;

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toBe(exception);

    const evidence = logger.warn.mock.calls[0][0] as string;
    expect(evidence).toContain('"requestId":"request-123"');
    expect(evidence).toContain('"route":"/public/bookings/:bookingId/payment"');
    expect(evidence).toContain('"statusCode":400');
    expect(evidence).toContain('"exception":"BadRequestException"');
    expect(evidence).not.toContain('customer@example.com');
    expect(evidence).not.toContain('private-ticket-token');
  });

  it('records unexpected failures at error severity without their message', async () => {
    const interceptor = new RequestFailureInterceptor();
    const logger = (interceptor as unknown as { logger: { error: jest.Mock } })
      .logger;
    jest.spyOn(logger, 'error').mockImplementation();
    const exception = new Error('postgresql://user:password@private-host/data');
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          requestId: 'request-500',
          method: 'GET',
          baseUrl: '/health',
          route: { path: '/ready' },
        }),
      }),
    } as ExecutionContext;
    const next = {
      handle: () => throwError(() => exception),
    } as CallHandler;

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toBe(exception);

    const evidence = logger.error.mock.calls[0][0] as string;
    expect(evidence).toContain('"statusCode":500');
    expect(evidence).toContain('"exception":"Error"');
    expect(evidence).not.toContain('password');
    expect(evidence).not.toContain('private-host');
  });
});
