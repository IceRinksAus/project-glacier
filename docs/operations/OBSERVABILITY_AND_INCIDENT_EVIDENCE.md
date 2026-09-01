# Observability and Incident Evidence

## Status

Sprint 31 local foundation. External log storage, uptime checks, error tracking and alert delivery remain deferred until a funded environment is approved.

## Request correlation

Every API response includes `X-Request-Id`. Glacier accepts a caller-supplied identifier only when it contains 1–128 ASCII letters, numbers, underscores or hyphens; otherwise the API generates a UUID. Staff may provide this identifier when reporting an error so an operator can locate the matching server evidence.

The API emits JSON evidence for every completed request:

- event name;
- request identifier;
- HTTP method;
- matched route template;
- response status; and
- duration in milliseconds.

Failed controller/service operations also record the safe exception class and status against the same request identifier. The original exception continues through NestJS's normal response handling.

Expected 4xx client rejections are warning evidence. Unexpected 5xx failures are error evidence. This distinction supports meaningful future alert thresholds without treating ordinary validation or authorisation denials as service outages.

## Privacy boundary

Request evidence must never include:

- request or response bodies;
- query strings;
- raw URLs when no route matched;
- passwords, cookies, JWTs or public-access credentials;
- Ticket, Booking-access or Waiver tokens;
- Stripe secrets, client secrets or full provider payloads;
- email addresses, names, notes or waiver answers; or
- database connection details.

Matched route templates such as `/tickets/:token` are recorded instead of concrete token-bearing paths. Unmatched paths are recorded only as `unmatched`.

## Local incident procedure

1. Record the UTC time, affected workflow, environment and `X-Request-Id` shown in the response.
2. Search the API output for that exact request identifier.
3. Record the safe event, route template, status and exception class without copying personal or credential data.
4. Classify severity and whether payment, Ticket issuance, admission, inventory or waiver evidence may be affected.
5. Preserve relevant immutable Glacier records; do not repair financial or admission state directly in the database.
6. Follow the applicable Payment reconciliation, refund, Ticket adjustment or recovery workflow.
7. Escalate any suspected credential or personal-data exposure immediately and rotate affected secrets.

## Future deployment gate

Before internet exposure, the approved environment must add:

- central structured-log collection with access control, retention and Australian data-location review;
- API and public-web error tracking with source-map and personal-data controls;
- independent liveness and readiness monitoring;
- alert rules for sustained API errors, authentication abuse, public mutation limits, Payment/webhook/refund/reconciliation failures, database saturation and backup failures;
- named primary and backup recipients plus acknowledgement expectations;
- clock synchronisation and deployed release/commit identifiers; and
- a rehearsed incident record, severity and escalation process.

Local JSON output proves only the application evidence shape. It does not prove external delivery, retention, alerting or incident response.
