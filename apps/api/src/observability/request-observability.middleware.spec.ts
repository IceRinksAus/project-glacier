import { EventEmitter } from 'events';

import { RequestObservabilityMiddleware } from './request-observability.middleware';
import { REQUEST_ID_HEADER } from './request-observability.types';

describe('RequestObservabilityMiddleware', () => {
  function createResponse(statusCode = 200) {
    const response = new EventEmitter() as EventEmitter & {
      statusCode: number;
      setHeader: jest.Mock;
    };
    response.statusCode = statusCode;
    response.setHeader = jest.fn();
    return response;
  }

  it('retains a bounded caller request ID and returns it to the caller', () => {
    const middleware = new RequestObservabilityMiddleware();
    const response = createResponse();
    const request = {
      headers: { [REQUEST_ID_HEADER]: 'gate-device-123' },
      method: 'GET',
      baseUrl: '/tickets',
      route: { path: '/:token' },
    } as never;
    const next = jest.fn();

    middleware.use(request, response as never, next);

    expect(request).toMatchObject({ requestId: 'gate-device-123' });
    expect(response.setHeader).toHaveBeenCalledWith(
      REQUEST_ID_HEADER,
      'gate-device-123',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('replaces unsafe request IDs and logs only the matched route template', () => {
    const middleware = new RequestObservabilityMiddleware();
    const logger = (middleware as unknown as { logger: { log: jest.Mock } })
      .logger;
    jest.spyOn(logger, 'log').mockImplementation();
    const response = createResponse();
    const request = {
      headers: { [REQUEST_ID_HEADER]: 'unsafe request id?token=secret' },
      method: 'GET',
      baseUrl: '/tickets',
      route: { path: '/:token' },
      originalUrl: '/tickets/private-ticket-token?email=person@example.com',
    } as never;

    middleware.use(request, response as never, jest.fn());
    response.emit('finish');

    const returnedId = response.setHeader.mock.calls[0][1] as string;
    expect(returnedId).toMatch(/^[0-9a-f-]{36}$/);
    const evidence = logger.log.mock.calls[0][0] as string;
    expect(evidence).toContain('"route":"/tickets/:token"');
    expect(evidence).not.toContain('private-ticket-token');
    expect(evidence).not.toContain('person@example.com');
    expect(evidence).not.toContain('unsafe request id');
  });

  it('does not log the raw path for an unmatched route', () => {
    const middleware = new RequestObservabilityMiddleware();
    const logger = (middleware as unknown as { logger: { warn: jest.Mock } })
      .logger;
    jest.spyOn(logger, 'warn').mockImplementation();
    const response = createResponse(404);
    const request = {
      headers: {},
      method: 'GET',
      originalUrl: '/unknown/private-value',
    } as never;

    middleware.use(request, response as never, jest.fn());
    response.emit('finish');

    const evidence = logger.warn.mock.calls[0][0] as string;
    expect(evidence).toContain('"route":"unmatched"');
    expect(evidence).not.toContain('private-value');
  });
});
