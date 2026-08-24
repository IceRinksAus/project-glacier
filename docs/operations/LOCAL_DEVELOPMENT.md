# Local Development

## Start API

```bash
cd ~/Documents/project-glacier/apps/api
npm run start:dev
```

## Start Web Application

```bash
cd ~/Documents/project-glacier/apps/web
npm run dev
```

The Next.js application serves both the organiser dashboard and public customer routes. The canonical handoff uses:

- dashboard: `http://localhost:3002`
- public Event and booking experience: `http://localhost:3001`

During stable preview verification, build the web application and run it on `3002`. A lightweight local reverse proxy may expose the same current build on `3001` and redirect its root to the fictional active Event used for acceptance. This proxy is a local convenience only; it is not deployment architecture.

## Prisma

```bash
npx prisma studio
npx prisma format
npx prisma validate
npx prisma migrate dev --name <name>
npx prisma generate
```

## API Environment

`apps/api/.env`

Expected local variables include:

- `DATABASE_URL`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `WEB_APP_URL`
- `CORS_ORIGINS`

Never commit real secrets.

`WEB_APP_URL` is the canonical web origin encoded in Event Waiver QR codes. The local fallback is `http://localhost:3001`. Production must set the deployed HTTPS origin explicitly.

`CORS_ORIGINS` is a comma-separated allowlist of trusted web origins. Local development defaults to `http://localhost:3001`. Production fails to start when this variable is absent; wildcard origins must not be used with credentials.

`NEXT_DIST_DIR` optionally selects an isolated Next.js output directory for parallel local preview verification. Leave it unset for normal development; the default remains `.next`.

## Web Environment

`apps/web/.env.local`

Expected Stripe browser configuration includes:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Only Stripe publishable keys belong in browser-exposed environment variables.

Never place a Stripe secret key or webhook signing secret in `NEXT_PUBLIC_*`.

## Local Stripe Webhooks

Authenticate the Stripe CLI:

```bash
stripe login
```

Forward Stripe events to the local API:

```bash
stripe listen --forward-to localhost:3000/payment/stripe/webhook
```

The Stripe CLI prints a local webhook signing secret.

Use that value as `STRIPE_WEBHOOK_SECRET` for the API process receiving those forwarded events.

Restart the API after changing local environment values.

## Stripe Test Payments

Use Stripe test mode for local development.

PaymentIntent creation should occur through Glacier's public payment endpoint rather than by supplying an amount from the browser.

The Stripe CLI may be used to inspect or exercise test PaymentIntents during development.

## Payment Reconciliation Operations

Signed Stripe webhooks remain Glacier's normal payment-completion path. The expired-reservation scheduler is a recovery control: it retrieves provider truth before attempting cancellation and safely closes provider-cancelled or failed Payments. A provider success discovered after Booking expiry remains recorded as a successful charge, but the Booking stays expired, no Ticket is issued and Glacier requests the existing idempotent late-success refund.

For an organiser investigation:

1. Find the Booking through the dashboard Bookings register using customer name, email, Booking number, Event or Session.
2. Open the Booking investigation page and compare Booking, Payment, refund and Ticket state.
3. Use **Reconcile payment** only when a locally pending Payment is shown. This re-reads provider truth; it is not a manual “mark paid” action.
4. If the provider remains pending, wait for normal provider/webhook processing and retry later. Do not edit database payment state.
5. Escalate repeated provider retrieval/refund failures with the Booking number, reconciliation timestamp and bounded error shown in Glacier. Do not copy secrets, client secrets or raw provider payloads into support notes.

Every manual reconciliation attempt records the Organisation, Event, Booking, acting User, trigger, outcome, provider status and bounded failure context. Provider references remain masked in the organiser UI.

When testing missed-webhook recovery, verify all four outcomes together: the Booking lifecycle, local Payment state, refund count/status and Ticket count. Re-running reconciliation must not create a duplicate refund or Ticket.

## Local Ports

Current canonical local preview contract:

- API: `http://localhost:3000`
- Public customer experience: `http://localhost:3001`
- Organiser dashboard: `http://localhost:3002`

The API CORS configuration must permit both trusted local web origins when both previews are used.

After changing source code while running a production preview, rebuild and restart the web process before acceptance testing. Development hot reload is not evidence that the canonical production preview contains the current checkpoint.

The routed public journey begins at `/event/:eventSlug` and continues to `/book/:eventId/date`, followed by Session selection for that Event-timezone date. A hard refresh before reservation creation intentionally restarts in-memory checkout state rather than persisting customer or participant information insecurely.

## Secret Safety

Before committing payment work, verify local secrets remain ignored:

```bash
git check-ignore -v apps/api/.env apps/web/.env.local
```

Do not commit:

- Stripe secret keys
- Stripe webhook signing secrets
- database passwords
- JWT secrets
- PaymentIntent client secrets
