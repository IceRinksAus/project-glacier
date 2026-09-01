import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

interface RateLimitPolicy {
  id: string;
  limit: number;
  windowMs: number;
  matches(method: string, path: string): boolean;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const MINUTE = 60_000;
const MAX_TRACKED_KEYS = 50_000;

export const ABUSE_LIMIT_POLICIES: RateLimitPolicy[] = [
  {
    id: 'operator-login',
    limit: 20,
    windowMs: 15 * MINUTE,
    matches: (method, path) => method === 'POST' && path === '/auth/login',
  },
  {
    id: 'public-commerce-write',
    limit: 120,
    windowMs: MINUTE,
    matches: (method, path) =>
      method === 'POST' &&
      (/^\/public\/(customers|bookings)$/.test(path) ||
        /^\/public\/bookings\/[^/]+\/(payments|status)$/.test(path) ||
        /^\/public\/bookings\/[^/]+\/flexible-ticket-requests(?:\/[^/]+\/withdraw)?$/.test(
          path,
        )),
  },
  {
    id: 'public-waiver-submission',
    limit: 30,
    windowMs: MINUTE,
    matches: (method, path) =>
      method === 'POST' &&
      /^\/public\/waivers\/[^/]+\/submissions$/.test(path),
  },
  {
    id: 'public-possession-lookup',
    limit: 120,
    windowMs: MINUTE,
    matches: (method, path) =>
      method === 'GET' &&
      (/^\/ticket\/token\/[^/]+(?:\/qr)?$/.test(path) ||
        /^\/public\/waivers\/verifications\/[^/]+$/.test(path)),
  },
];

@Injectable()
export class AbuseProtectionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AbuseProtectionMiddleware.name);
  private readonly entries = new Map<string, RateLimitEntry>();
  private requestCount = 0;

  use(request: Request, response: Response, next: NextFunction) {
    const path = request.originalUrl.split('?', 1)[0];
    const policy = ABUSE_LIMIT_POLICIES.find((candidate) =>
      candidate.matches(request.method, path),
    );
    if (!policy) return next();

    const now = Date.now();
    this.requestCount += 1;
    if (this.requestCount % 1_000 === 0) this.removeExpiredEntries(now);

    const key = `${policy.id}:${request.ip}`;
    const existing = this.entries.get(key);
    const entry =
      !existing || existing.resetAt <= now
        ? { count: 0, resetAt: now + policy.windowMs }
        : existing;

    if (!existing && this.entries.size >= MAX_TRACKED_KEYS) {
      this.removeExpiredEntries(now);
      if (this.entries.size >= MAX_TRACKED_KEYS) {
        return this.reject(response, policy, Math.ceil(policy.windowMs / 1000));
      }
    }

    entry.count += 1;
    this.entries.set(key, entry);

    response.setHeader('RateLimit-Limit', policy.limit.toString());
    response.setHeader(
      'RateLimit-Remaining',
      Math.max(0, policy.limit - entry.count).toString(),
    );
    response.setHeader(
      'RateLimit-Reset',
      Math.max(1, Math.ceil((entry.resetAt - now) / 1000)).toString(),
    );

    if (entry.count > policy.limit) {
      return this.reject(
        response,
        policy,
        Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      );
    }

    next();
  }

  private reject(response: Response, policy: RateLimitPolicy, retryAfter: number) {
    response.setHeader('Retry-After', retryAfter.toString());
    this.logger.warn(
      JSON.stringify({
        event: 'api.abuse_limit.rejected',
        policy: policy.id,
        retryAfterSeconds: retryAfter,
      }),
    );
    return response.status(429).json({
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
    });
  }

  private removeExpiredEntries(now: number) {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
  }
}
