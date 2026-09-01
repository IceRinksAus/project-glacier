import type { Request } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

export type ObservableRequest = Request & {
  requestId?: string;
  route?: {
    path?: string;
  };
};

export function matchedRoute(request: ObservableRequest) {
  const routePath = request.route?.path;

  if (typeof routePath !== 'string') {
    return 'unmatched';
  }

  return `${request.baseUrl ?? ''}${routePath}` || '/';
}
