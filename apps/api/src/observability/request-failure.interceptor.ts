import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, throwError } from 'rxjs';

import { matchedRoute, ObservableRequest } from './request-observability.types';

@Injectable()
export class RequestFailureInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestFailureInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<ObservableRequest>();

    return next.handle().pipe(
      catchError((error: unknown) => {
        const statusCode =
          error instanceof HttpException ? error.getStatus() : 500;
        const exception =
          error instanceof Error ? error.constructor.name : 'UnknownError';

        const evidence = JSON.stringify({
          event: 'api.request.failed',
          requestId: request.requestId ?? 'unavailable',
          method: request.method,
          route: matchedRoute(request),
          statusCode,
          exception,
        });

        if (statusCode >= 500) {
          this.logger.error(evidence);
        } else {
          this.logger.warn(evidence);
        }

        return throwError(() => error);
      }),
    );
  }
}
