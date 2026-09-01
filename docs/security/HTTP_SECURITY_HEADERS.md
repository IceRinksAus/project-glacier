# HTTP Security Headers

## Status

Sprint 31 application baseline. Final HTTPS/HSTS and Content Security Policy evidence still requires the approved deployed origins and real Stripe/scanner acceptance.

## API baseline

All NestJS API responses:

- disable Express's `X-Powered-By` disclosure;
- prevent MIME sniffing with `X-Content-Type-Options: nosniff`;
- prevent framing with both `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`;
- prevent API content from loading scripts, media, forms or base URLs through a deny-by-default API Content Security Policy;
- send no referrer information; and
- disable camera, microphone, geolocation and browsing-topics browser features.

These headers do not replace authentication, authorisation, CORS, validation or deployment-edge limits.

## Web baseline

All Next.js routes:

- prevent MIME sniffing;
- prevent framing/clickjacking;
- use `strict-origin-when-cross-origin` referrer handling;
- permit the camera only to the same origin for the Staff Scanner; and
- disable microphone, geolocation and browsing-topics access.

Camera permission does not bypass browser consent. Production scanning still requires HTTPS, explicit user permission and physical-device acceptance.

## Deliberately deferred headers

### Strict Transport Security

`Strict-Transport-Security` must be configured and verified at the HTTPS edge after real hostnames and subdomain ownership are approved. Enabling `includeSubDomains` or preload before every affected hostname supports HTTPS could make legitimate services inaccessible. Local HTTP evidence cannot close this gate.

### Web Content Security Policy

The API safely uses a deny-all policy because it does not render the booking interface. The web application does not yet impose a broad CSP because Next.js scripts, Stripe.js/payment frames, Event media and the Scanner camera workflow require an evidence-based policy. A guessed policy could silently break checkout or event-day admission.

Before internet exposure, staging must collect the exact required sources, begin with report-only monitoring, confirm no credentials/personal data enter reports, then enforce a reviewed policy covering at minimum:

- `default-src`, `script-src`, `style-src`, `img-src`, `font-src` and `connect-src`;
- `frame-src` for approved Stripe origins;
- `frame-ancestors`, `base-uri`, `form-action` and `object-src`;
- Event asset/object-storage origins; and
- nonce or hash handling where required by the deployed Next.js rendering model.

## Verification

Automated tests assert the application header definitions. Future staging smoke tests must inspect headers through the real HTTPS edge on representative dashboard, booking, scanner, Ticket, Waiver, API and asset routes. They must also complete Stripe test-mode checkout and physical scanner camera checks after enforcement.
