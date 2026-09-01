import { AbuseProtectionMiddleware } from './abuse-protection.middleware';

describe('AbuseProtectionMiddleware', () => {
  function request(path: string, method = 'POST', ip = '127.0.0.1') {
    return { originalUrl: path, method, ip } as never;
  }

  function response() {
    const result = {
      setHeader: jest.fn(),
      status: jest.fn(),
      json: jest.fn(),
    };
    result.status.mockReturnValue(result);
    result.json.mockReturnValue(result);
    return result;
  }

  afterEach(() => jest.restoreAllMocks());

  it('allows unrelated and protected operator routes without consuming a limit', () => {
    const middleware = new AbuseProtectionMiddleware();
    const next = jest.fn();
    const result = response();

    middleware.use(request('/event/event-1', 'GET'), result as never, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(result.setHeader).not.toHaveBeenCalled();
  });

  it('matches the pathname without retaining query values', () => {
    const middleware = new AbuseProtectionMiddleware();
    const result = response();

    middleware.use(
      request('/auth/login?returnTo=private-value'),
      result as never,
      jest.fn(),
    );

    expect(result.setHeader).toHaveBeenCalledWith('RateLimit-Limit', '20');
  });

  it('limits repeated login attempts by source address without logging the address', () => {
    const middleware = new AbuseProtectionMiddleware();
    const logger = (middleware as unknown as { logger: { warn: jest.Mock } })
      .logger;
    jest.spyOn(logger, 'warn').mockImplementation();

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const next = jest.fn();
      middleware.use(
        request('/auth/login'),
        response() as never,
        next,
      );
      expect(next).toHaveBeenCalledTimes(1);
    }

    const blocked = response();
    const blockedNext = jest.fn();
    middleware.use(
      request('/auth/login'),
      blocked as never,
      blockedNext,
    );

    expect(blockedNext).not.toHaveBeenCalled();
    expect(blocked.status).toHaveBeenCalledWith(429);
    expect(blocked.json).toHaveBeenCalledWith({
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('"policy":"operator-login"'),
    );
    expect(logger.warn.mock.calls[0][0]).not.toContain('127.0.0.1');
  });

  it('maintains independent counters for different source addresses', () => {
    const middleware = new AbuseProtectionMiddleware();

    for (let attempt = 0; attempt < 21; attempt += 1) {
      middleware.use(
        request('/auth/login'),
        response() as never,
        jest.fn(),
      );
    }

    const next = jest.fn();
    middleware.use(
      request('/auth/login', 'POST', '127.0.0.2'),
      response() as never,
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('resets a counter after its policy window', () => {
    const middleware = new AbuseProtectionMiddleware();
    let now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    for (let attempt = 0; attempt < 21; attempt += 1) {
      middleware.use(
        request('/auth/login'),
        response() as never,
        jest.fn(),
      );
    }

    now += 15 * 60_000;
    const next = jest.fn();
    middleware.use(request('/auth/login'), response() as never, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['/public/bookings', 'POST'],
    ['/public/bookings/booking-1/payments', 'POST'],
    ['/public/waivers/event-waiver/submissions', 'POST'],
    ['/ticket/token/opaque-token', 'GET'],
    ['/public/waivers/verifications/opaque-token', 'GET'],
  ])('adds limit evidence to sensitive public route %s', (path, method) => {
    const middleware = new AbuseProtectionMiddleware();
    const result = response();

    middleware.use(request(path, method), result as never, jest.fn());

    expect(result.setHeader).toHaveBeenCalledWith(
      'RateLimit-Remaining',
      expect.any(String),
    );
  });
});
