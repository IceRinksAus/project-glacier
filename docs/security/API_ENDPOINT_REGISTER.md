# API Endpoint Security Register

## Purpose

This register is the Sprint 17 control for classifying every Glacier API route. It records intended audience, authentication, role policy, tenant path, validation status and Sprint action.

Status values:

- `PROTECTED` — current boundary matches the intended policy.
- `PUBLIC` — deliberately public and subject to minimised response/validation review.
- `EXTERNAL` — authenticated by a trusted external protocol rather than Glacier JWT.
- `HARDEN` — existing route requires Sprint 17 protection or validation.
- `REVIEW/REMOVE` — legacy or duplicate route must be proven necessary before retention.

## Platform and Authentication

| Method | Route         | Audience       | Authentication | Validation                             | Status    | Sprint 17 action                                                                             |
| ------ | ------------- | -------------- | -------------- | -------------------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| GET    | `/`           | Health         | None           | N/A                                    | PUBLIC    | Confirm response contains no internal detail.                                                |
| POST   | `/auth/login` | Operator/Staff | Credentials    | Strict bounded DTO through global pipe | PROTECTED | Generic credential failure; deployment-edge rate limiting is required before pilot exposure. |
| GET    | `/auth/me`    | Operator/Staff | JWT            | N/A                                    | PROTECTED | Typed, minimal JWT claims response.                                                          |

## Organisation and Users

| Method | Route                     | Audience         | Authentication/role target | Tenant path                        | Validation                        | Status    | Sprint 17 action                                                                |
| ------ | ------------------------- | ---------------- | -------------------------- | ---------------------------------- | --------------------------------- | --------- | ------------------------------------------------------------------------------- |
| GET    | `/organization`           | Operator         | JWT OWNER/MEMBER           | JWT Organisation                   | None                              | PROTECTED | Returns only authenticated Organisation with explicit fields.                   |
| POST   | `/organization`           | Onboarding/Admin | Controlled bootstrap       | Not currently expressible          | N/A                               | PROTECTED | Removed from ordinary API; future onboarding needs a controlled bootstrap flow. |
| POST   | `/organization/:id/users` | Operator         | JWT OWNER                  | JWT Organisation must equal target | Strict DTO                        | PROTECTED | Role allowlist and tenant equality enforced.                                    |
| GET    | `/user`                   | Operator         | JWT OWNER/MEMBER           | Membership in JWT Organisation     | None                              | PROTECTED | Returns only users/membership in authenticated Organisation.                    |
| POST   | `/user`                   | Operator         | JWT OWNER                  | JWT Organisation                   | Strict DTO; no Organisation field | PROTECTED | Organisation comes only from JWT context.                                       |

## Event and Catalogue Administration

| Method | Route                       | Audience | Authentication/role target | Tenant path                       | Validation                   | Status    | Sprint 17 action                                                                        |
| ------ | --------------------------- | -------- | -------------------------- | --------------------------------- | ---------------------------- | --------- | --------------------------------------------------------------------------------------- |
| GET    | `/event`                    | Operator | JWT OWNER/MEMBER           | Event → Organisation              | DTO/query review             | PROTECTED | Add/retain guard and tenant tests.                                                      |
| GET    | `/event/:id`                | Operator | JWT OWNER/MEMBER           | Event → Organisation              | Param string                 | PROTECTED | Add/retain cross-tenant test.                                                           |
| POST   | `/event`                    | Operator | JWT OWNER                  | JWT Organisation                  | DTO                          | PROTECTED | Confirm strict runtime validation.                                                      |
| PATCH  | `/event/:id/status`         | Operator | JWT OWNER                  | Event → Organisation              | DTO                          | PROTECTED | Confirm strict runtime validation.                                                      |
| DELETE | `/event/:id`                | Operator | JWT OWNER                  | Event → Organisation              | Param string                 | PROTECTED | Retain dependency/business checks.                                                      |
| POST   | `/category`                 | Operator | JWT OWNER                  | Category → Event → Organisation   | Strict DTO                   | PROTECTED | Event ownership proven before create.                                                   |
| GET    | `/category`                 | Operator | JWT OWNER/MEMBER           | Category → Event → Organisation   | None                         | PROTECTED | Tenant-scoped list.                                                                     |
| GET    | `/category/:id`             | Operator | JWT OWNER/MEMBER           | Category → Event → Organisation   | Param string                 | PROTECTED | Tenant-scoped detail.                                                                   |
| DELETE | `/category/:id`             | Operator | JWT OWNER                  | Category → Event → Organisation   | Param string                 | PROTECTED | Tenant-scoped mutation.                                                                 |
| GET    | `/ticket-type`              | Operator | JWT OWNER/MEMBER           | TicketType → Event → Organisation | None                         | PROTECTED | Tenant-scoped list.                                                                     |
| POST   | `/ticket-type`              | Operator | JWT OWNER                  | TicketType → Event → Organisation | Strict DTO                   | PROTECTED | Event ownership proven before create.                                                   |
| POST   | `/rule`                     | Operator | JWT OWNER                  | Rule → Event → Organisation       | Strict DTO                   | PROTECTED | Event ownership proven before create.                                                   |
| GET    | `/rule`                     | Operator | JWT OWNER/MEMBER           | Rule → Event → Organisation       | None                         | PROTECTED | Tenant-scoped list.                                                                     |
| GET    | `/rule/:id`                 | Operator | JWT OWNER/MEMBER           | Rule → Event → Organisation       | Param string                 | PROTECTED | Tenant-scoped detail.                                                                   |
| PATCH  | `/rule/:id`                 | Operator | JWT OWNER                  | Rule → Event → Organisation       | Strict DTO without `eventId` | PROTECTED | Parent Event reassignment is not accepted.                                              |
| DELETE | `/rule/:id`                 | Operator | JWT OWNER                  | Rule → Event → Organisation       | Param string                 | PROTECTED | Tenant-scoped mutation.                                                                 |
| POST   | `/rule-evaluation/:eventId` | Legacy   | N/A                        | N/A                               | N/A                          | PROTECTED | Removed; dedicated public Booking evaluation and internal service remain authoritative. |

## Product, Session and Schedule Administration

| Route group             | Audience | Authentication/role  | Tenant path                              | Status    | Sprint 17 action                                             |
| ----------------------- | -------- | -------------------- | ---------------------------------------- | --------- | ------------------------------------------------------------ |
| `/product`              | Operator | JWT; OWNER mutations | Product → Event → Organisation           | PROTECTED | Confirm strict runtime validation and negative tenant tests. |
| `/product-variant`      | Operator | JWT; OWNER mutations | Variant → Product → Event → Organisation | PROTECTED | Confirm strict runtime validation and negative tenant tests. |
| `/session-product`      | Operator | JWT; OWNER mutations | Session/Product → Event → Organisation   | PROTECTED | Confirm cross-parent tenant integrity.                       |
| `/session`              | Operator | JWT; OWNER mutations | Session → Event → Organisation           | PROTECTED | Preserve time, capacity and overlap rules.                   |
| `/operational-schedule` | Operator | JWT OWNER            | Schedule → Event → Organisation          | PROTECTED | Preserve generation and transactional behaviour.             |

## Booking and Customer Administration

| Method | Route           | Audience | Authentication/role target | Tenant path                               | Validation   | Status    | Sprint 17 action                                                                           |
| ------ | --------------- | -------- | -------------------------- | ----------------------------------------- | ------------ | --------- | ------------------------------------------------------------------------------------------ |
| GET    | `/booking`      | Operator | JWT OWNER/MEMBER           | Booking → Event → Organisation            | None         | PROTECTED | Tenant-scoped list.                                                                        |
| GET    | `/booking/:id`  | Operator | JWT OWNER/MEMBER           | Booking → Event → Organisation            | Param string | PROTECTED | Tenant-scoped detail.                                                                      |
| POST   | `/booking`      | Legacy   | N/A                        | N/A                                       | N/A          | PROTECTED | Removed; dedicated public Booking route remains authoritative.                             |
| GET    | `/customer`     | Operator | JWT OWNER/MEMBER           | Customer → Booking → Event → Organisation | None         | PROTECTED | Only customers with a Booking in the authenticated Organisation; nested Bookings filtered. |
| GET    | `/customer/:id` | Operator | JWT OWNER/MEMBER           | Customer → Booking → Event → Organisation | Param string | PROTECTED | Tenant-scoped detail with nested Bookings filtered.                                        |
| POST   | `/customer`     | Legacy   | N/A                        | N/A                                       | N/A          | PROTECTED | Removed; dedicated public Customer route remains authoritative.                            |

## Ticket and Gate Operations

| Method | Route                     | Audience        | Authentication/role target    | Tenant path                             | Validation              | Status    | Sprint 17 action                                                                          |
| ------ | ------------------------- | --------------- | ----------------------------- | --------------------------------------- | ----------------------- | --------- | ----------------------------------------------------------------------------------------- |
| GET    | `/ticket/token/:token`    | Customer/holder | High-entropy possession token | Ticket token                            | 64-character hex format | PUBLIC    | Response limited to Ticket status, participant name, Event and Session presentation data. |
| GET    | `/ticket/validate/:token` | Staff pre-check | JWT MEMBER/OWNER              | Ticket → Booking → Event → Organisation | 64-character hex format | PROTECTED | Authenticated and tenant-scoped.                                                          |
| POST   | `/ticket/scan/:token`     | Staff           | JWT MEMBER/OWNER              | Ticket → Booking → Event → Organisation | 64-character hex format | PROTECTED | Authenticated/tenant-scoped; atomic status update preserved.                              |
| GET    | `/ticket/:id/qr`          | Operator        | JWT OWNER/MEMBER              | Ticket → Booking → Event → Organisation | Param string            | PROTECTED | Authenticated and tenant-scoped.                                                          |
| GET    | `/ticket/:id`             | Operator        | JWT OWNER/MEMBER              | Ticket → Booking → Event → Organisation | Param string            | PROTECTED | Authenticated and tenant-scoped.                                                          |

## Payment

| Method | Route                     | Audience | Authentication              | Tenant path                       | Validation         | Status    | Sprint 17 action                                                     |
| ------ | ------------------------- | -------- | --------------------------- | --------------------------------- | ------------------ | --------- | -------------------------------------------------------------------- |
| POST   | `/payment/:bookingId`     | Legacy   | N/A                         | N/A                               | N/A                | PROTECTED | Removed; token-protected public Payment route remains authoritative. |
| POST   | `/payment/stripe/webhook` | Stripe   | Stripe signature + raw body | Provider event → internal records | Signature/raw body | EXTERNAL  | Preserve raw-body verification and idempotency.                      |

## Public Booking

| Method | Route                                    | Audience | Authentication              | Validation                    | Status | Sprint 17 action                                            |
| ------ | ---------------------------------------- | -------- | --------------------------- | ----------------------------- | ------ | ----------------------------------------------------------- |
| GET    | `/public/events/:eventId`                | Customer | None                        | Param string                  | PUBLIC | Confirm ACTIVE-only response minimisation.                  |
| GET    | `/public/events/:eventId/sessions`       | Customer | None                        | Param string                  | PUBLIC | Confirm availability and response minimisation.             |
| GET    | `/public/events/:eventId/ticket-types`   | Customer | None                        | Param string                  | PUBLIC | Confirm availability and response minimisation.             |
| POST   | `/public/events/:eventId/evaluate-rules` | Customer | None                        | Strict bounded nested DTO     | PUBLIC | Global strict validation; 1–50 participants.                |
| GET    | `/public/sessions/:sessionId/products`   | Customer | None                        | Param string                  | PUBLIC | Confirm Event/session availability and minimisation.        |
| POST   | `/public/customers`                      | Customer | None                        | Strict bounded DTO            | PUBLIC | Global strict validation and email validation.              |
| POST   | `/public/bookings`                       | Customer | None                        | Strict bounded nested DTO     | PUBLIC | Global strict validation; Booking authority unchanged.      |
| POST   | `/public/bookings/:bookingId/payments`   | Customer | Booking public-access token | Strict 64-character token DTO | PUBLIC | Global strict validation and hash-only server verification. |

## Public Waivers

| Method | Route                                              | Audience          | Authentication                | Validation                              | Status | Sprint 17 action                                                 |
| ------ | -------------------------------------------------- | ----------------- | ----------------------------- | --------------------------------------- | ------ | ---------------------------------------------------------------- |
| GET    | `/public/waivers/verifications/:verificationToken` | Credential holder | High-entropy possession token | Strict controller pipe + service format | PUBLIC | Retain privacy-minimised response.                               |
| GET    | `/public/waivers/:publicSlug`                      | Participant       | None                          | Strict controller pipe                  | PUBLIC | Retain active/published-only lookup.                             |
| POST   | `/public/waivers/:publicSlug/submissions`          | Participant       | None                          | Strict nested DTO and local pipe        | PUBLIC | Review abuse-control hook; retain server-authoritative evidence. |

## Event Waiver Administration

| Route group                                        | Audience | Authentication/role | Tenant path          | Status    | Sprint 17 action                          |
| -------------------------------------------------- | -------- | ------------------- | -------------------- | --------- | ----------------------------------------- |
| `GET /event/:eventId/waiver...`                    | Operator | JWT OWNER/MEMBER    | Event → Organisation | PROTECTED | Retain tenant tests.                      |
| `POST /event/:eventId/waiver/drafts`               | Operator | JWT OWNER           | Event → Organisation | PROTECTED | Retain template/value validation.         |
| `POST /event/:eventId/waiver/versions/:id/publish` | Operator | JWT OWNER           | Event → Organisation | PROTECTED | Retain immutable publication transaction. |

## Completion Rule

Sprint 17 cannot close while any `HARDEN` route lacks its agreed protection/tests or any `REVIEW/REMOVE` route remains accidentally public without a documented decision.
