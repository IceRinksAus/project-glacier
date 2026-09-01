import { randomUUID } from 'crypto';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';

import {
  matchedRoute,
  ObservableRequest,
  REQUEST_ID_HEADER,
} from './request-observability.types';

const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{1,128}$/;

@Injectable()
export class RequestObservabilityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestObservabilityMiddleware.name);

  use(request: ObservableRequest, response: Response, next: NextFunction) {
    const suppliedRequestId = request.headers[REQUEST_ID_HEADER];
    const requestId =
      typeof suppliedRequestId === 'string' &&
      SAFE_REQUEST_ID.test(suppliedRequestId)
        ? suppliedRequestId
        : randomUUID();
    const startedAt = process.hrtime.bigint();

    request.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    response.once('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const evidence = JSON.stringify({
        event: 'api.request.completed',
        requestId,
        method: request.method,
        route: matchedRoute(request),
        statusCode: response.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
      });

      if (response.statusCode >= 500) {
        this.logger.error(evidence);
      } else if (response.statusCode >= 400) {
        this.logger.warn(evidence);
      } else {
        this.logger.log(evidence);
      }
    });

    next();
  }
}
