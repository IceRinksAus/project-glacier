import { BadRequestException } from '@nestjs/common';

import { LoginDto } from '../auth/dto/login.dto';
import {
  applyApplicationSecurityHeaders,
  createApplicationValidationPipe,
  getCorsOrigins,
  getTrustedProxyHops,
  getWebAppUrl,
  validateApplicationEnvironment,
} from './application-security';

describe('application security configuration', () => {
  it('applies privacy-safe API response headers and removes framework disclosure', () => {
    let middleware: ((...args: never[]) => void) | undefined;
    const app = {
      disable: jest.fn(),
      use: jest.fn((handler) => {
        middleware = handler;
      }),
    };
    const response = {
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    applyApplicationSecurityHeaders(app as never);
    middleware?.({} as never, response as never, next as never);

    expect(app.disable).toHaveBeenCalledWith('x-powered-by');
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff',
    );
    expect(response.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('uses the local web origin outside production by default', () => {
    expect(getCorsOrigins({ NODE_ENV: 'development' })).toEqual([
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3005',
    ]);
  });

  it('parses an explicit origin allowlist', () => {
    expect(
      getCorsOrigins({
        NODE_ENV: 'production',
        CORS_ORIGINS:
          'https://app.glacier.example, https://admin.glacier.example ',
      }),
    ).toEqual(['https://app.glacier.example', 'https://admin.glacier.example']);
  });

  it('fails closed when production origins are not configured', () => {
    expect(() => getCorsOrigins({ NODE_ENV: 'production' })).toThrow(
      'CORS_ORIGINS must be configured in production.',
    );
  });

  it('accepts a complete HTTPS production environment', () => {
    expect(() =>
      validateApplicationEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://database.example/glacier',
        JWT_SECRET: 'a'.repeat(32),
        STRIPE_SECRET_KEY: 'sk_live_example',
        STRIPE_WEBHOOK_SECRET: 'whsec_example',
        WEB_APP_URL: 'https://app.glacier.example',
        CORS_ORIGINS:
          'https://app.glacier.example,https://admin.glacier.example',
        TRUST_PROXY_HOPS: '1',
      }),
    ).not.toThrow();
  });

  it('reports all missing production variables before startup', () => {
    expect(() =>
      validateApplicationEnvironment({ NODE_ENV: 'production' }),
    ).toThrow(
      'Missing required production environment variables: DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, WEB_APP_URL, CORS_ORIGINS, TRUST_PROXY_HOPS.',
    );
  });

  it('rejects a short production authentication secret', () => {
    expect(() =>
      validateApplicationEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://database.example/glacier',
        JWT_SECRET: 'too-short',
        STRIPE_SECRET_KEY: 'sk_live_example',
        STRIPE_WEBHOOK_SECRET: 'whsec_example',
        WEB_APP_URL: 'https://app.glacier.example',
        CORS_ORIGINS: 'https://app.glacier.example',
        TRUST_PROXY_HOPS: '1',
      }),
    ).toThrow('JWT_SECRET must contain at least 32 characters in production.');
  });

  it('rejects localhost and non-HTTPS production origins', () => {
    const environment = {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://database.example/glacier',
      JWT_SECRET: 'a'.repeat(32),
      STRIPE_SECRET_KEY: 'sk_live_example',
      STRIPE_WEBHOOK_SECRET: 'whsec_example',
      WEB_APP_URL: 'https://app.glacier.example',
      CORS_ORIGINS: 'http://localhost:3001',
      TRUST_PROXY_HOPS: '1',
    };

    expect(() => validateApplicationEnvironment(environment)).toThrow(
      'CORS_ORIGINS must use HTTPS in production.',
    );
  });

  it('uses a local web URL only outside production', () => {
    expect(getWebAppUrl({ NODE_ENV: 'development' })).toBe(
      'http://localhost:3001',
    );
    expect(() => getWebAppUrl({ NODE_ENV: 'production' })).toThrow(
      'WEB_APP_URL must be configured in production.',
    );
  });

  it('requires an explicit bounded trusted-proxy hop count in production', () => {
    expect(getTrustedProxyHops({ NODE_ENV: 'development' })).toBe(0);
    expect(
      getTrustedProxyHops({
        NODE_ENV: 'production',
        TRUST_PROXY_HOPS: '1',
      }),
    ).toBe(1);
    expect(() => getTrustedProxyHops({ NODE_ENV: 'production' })).toThrow(
      'TRUST_PROXY_HOPS must be configured in production.',
    );
    expect(() =>
      getTrustedProxyHops({
        NODE_ENV: 'production',
        TRUST_PROXY_HOPS: '4',
      }),
    ).toThrow('TRUST_PROXY_HOPS must be a whole number from 0 to 3.');
  });

  it('rejects unknown fields through the application validation pipe', async () => {
    const pipe = createApplicationValidationPipe();

    await expect(
      pipe.transform(
        {
          email: 'owner@example.com',
          password: 'secure-password',
          organizationId: 'untrusted-organization',
        },
        {
          type: 'body',
          metatype: LoginDto,
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects oversized login credentials before authentication work', async () => {
    const pipe = createApplicationValidationPipe();

    await expect(
      pipe.transform(
        {
          email: `${'a'.repeat(250)}@example.com`,
          password: 'p'.repeat(129),
        },
        {
          type: 'body',
          metatype: LoginDto,
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an empty login password before authentication work', async () => {
    const pipe = createApplicationValidationPipe();

    await expect(
      pipe.transform(
        {
          email: 'owner@example.com',
          password: '',
        },
        {
          type: 'body',
          metatype: LoginDto,
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
