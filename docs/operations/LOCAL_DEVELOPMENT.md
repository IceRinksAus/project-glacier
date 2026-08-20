# Local Development

## Start API

```bash
cd ~/Documents/project-glacier/apps/api
npm run start:dev
```

## Start Public Web

```bash
cd ~/Documents/project-glacier/apps/web
npm run dev
```

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

## Local Ports

Current local defaults:

- API: `http://localhost:3000`
- Web: `http://localhost:3001`

The API CORS configuration permits the local web application origin.

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
