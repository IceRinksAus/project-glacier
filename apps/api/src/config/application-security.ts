import { ValidationPipe } from '@nestjs/common';

type Environment = Record<string, string | undefined>;

export function createApplicationValidationPipe() {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

export function getCorsOrigins(environment: Environment = process.env) {
  const configuredOrigins = environment.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return configuredOrigins;
  }

  if (environment.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGINS must be configured in production.');
  }

  return ['http://localhost:3001'];
}
