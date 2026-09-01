import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { RequestHandler } from 'express';

type Environment = Record<string, string | undefined>;

const PRODUCTION_REQUIRED_VARIABLES = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'WEB_APP_URL',
  'CORS_ORIGINS',
  'TRUST_PROXY_HOPS',
] as const;

function requireHttpsUrl(name: string, value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }

  if (url.protocol !== 'https:') {
    throw new Error(`${name} must use HTTPS in production.`);
  }

  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    throw new Error(`${name} must not use a localhost address in production.`);
  }

  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${name} must contain an origin only, without a path.`);
  }
}

export function validateApplicationEnvironment(
  environment: Environment = process.env,
) {
  if (environment.NODE_ENV !== 'production') {
    return;
  }

  const missing = PRODUCTION_REQUIRED_VARIABLES.filter(
    (name) => !environment[name]?.trim(),
  );

  if (missing.length) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}.`,
    );
  }

  if ((environment.JWT_SECRET?.trim().length ?? 0) < 32) {
    throw new Error(
      'JWT_SECRET must contain at least 32 characters in production.',
    );
  }

  requireHttpsUrl('WEB_APP_URL', environment.WEB_APP_URL!);

  for (const origin of getCorsOrigins(environment)) {
    requireHttpsUrl('CORS_ORIGINS', origin);
  }

  getTrustedProxyHops(environment);
}

export function getWebAppUrl(environment: Environment = process.env) {
  const configuredUrl = environment.WEB_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  if (environment.NODE_ENV === 'production') {
    throw new Error('WEB_APP_URL must be configured in production.');
  }

  return 'http://localhost:3001';
}

export function createApplicationValidationPipe() {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

const API_SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const;

export function applyApplicationSecurityHeaders(app: NestExpressApplication) {
  app.disable('x-powered-by');

  const securityHeaders: RequestHandler = (_request, response, next) => {
    for (const [name, value] of Object.entries(API_SECURITY_HEADERS)) {
      response.setHeader(name, value);
    }

    next();
  };

  app.use(securityHeaders);
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

  return [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3005',
  ];
}

export function getTrustedProxyHops(environment: Environment = process.env) {
  const configured = environment.TRUST_PROXY_HOPS?.trim();

  if (!configured) {
    if (environment.NODE_ENV === 'production') {
      throw new Error('TRUST_PROXY_HOPS must be configured in production.');
    }
    return 0;
  }

  if (!/^[0-9]+$/.test(configured)) {
    throw new Error('TRUST_PROXY_HOPS must be a whole number from 0 to 3.');
  }

  const hops = Number(configured);
  if (hops < 0 || hops > 3) {
    throw new Error('TRUST_PROXY_HOPS must be a whole number from 0 to 3.');
  }

  return hops;
}
