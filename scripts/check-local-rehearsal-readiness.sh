#!/usr/bin/env bash

set -u

failures=0
warnings=0

pass() {
  printf 'PASS  %s\n' "$1"
}

fail() {
  printf 'FAIL  %s\n' "$1"
  failures=$((failures + 1))
}

warn() {
  printf 'WARN  %s\n' "$1"
  warnings=$((warnings + 1))
}

check_http() {
  label="$1"
  url="$2"
  expected="$3"

  response="$(curl --silent --show-error --max-time 4 --output /dev/null --write-out '%{http_code}' "$url" 2>/dev/null || true)"
  if [ -z "$response" ] || [ "$response" = '000' ]; then
    fail "$label is not responding at $url"
  elif printf '%s\n' "$response" | grep -Eq "^(${expected})$"; then
    pass "$label is available at $url"
  else
    fail "$label returned HTTP $response at $url (expected ${expected//|/, })"
  fi
}

printf 'Glacier local rehearsal readiness\n\n'

if command -v pg_isready >/dev/null 2>&1; then
  if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    pass 'PostgreSQL is accepting connections on localhost:5432'
  else
    fail 'PostgreSQL is not accepting connections on localhost:5432'
  fi
elif [ -x /Library/PostgreSQL/18/bin/pg_isready ]; then
  if /Library/PostgreSQL/18/bin/pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    pass 'PostgreSQL is accepting connections on localhost:5432'
  else
    fail 'PostgreSQL is not accepting connections on localhost:5432'
  fi
else
  warn 'pg_isready was not found; PostgreSQL will still be checked through API readiness'
fi

check_http 'API readiness' 'http://localhost:3000/health/ready' '200'
check_http 'Public customer site' 'http://localhost:3001' '200|301|302|307|308'
check_http 'Organiser dashboard' 'http://localhost:3002' '200|301|302|307|308'

if pgrep -f 'stripe[[:space:]]+listen.*payment/stripe/webhook' >/dev/null 2>&1; then
  pass 'Stripe CLI webhook forwarding process is running'
else
  fail 'Stripe CLI webhook forwarding is not running; do not begin a card-payment rehearsal'
fi

if [ -f apps/api/.env ] && grep -Eq '^STRIPE_WEBHOOK_SECRET=.+$' apps/api/.env; then
  pass 'The API has a local Stripe webhook secret configured'
else
  fail 'apps/api/.env does not contain a non-empty STRIPE_WEBHOOK_SECRET'
fi

printf '\nResult: %s failure(s), %s warning(s).\n' "$failures" "$warnings"

if [ "$failures" -ne 0 ]; then
  exit 1
fi

printf 'Ready for the local rehearsal. Keep the Stripe listener open during card payments.\n'
