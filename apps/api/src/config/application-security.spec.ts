import { BadRequestException } from '@nestjs/common';

import { LoginDto } from '../auth/dto/login.dto';
import {
  createApplicationValidationPipe,
  getCorsOrigins,
} from './application-security';

describe('application security configuration', () => {
  it('uses the local web origin outside production by default', () => {
    expect(getCorsOrigins({ NODE_ENV: 'development' })).toEqual([
      'http://localhost:3001',
      'http://localhost:3002',
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
