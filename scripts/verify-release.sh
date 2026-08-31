#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$project_root"

echo "Checking API tests"
npm --prefix apps/api test -- --runInBand

echo "Checking API production build"
npm --prefix apps/api run build

echo "Checking web tests"
npm --prefix apps/web test

echo "Checking web production build in an isolated output directory"
NEXT_DIST_DIR=.next-release npm --prefix apps/web run build -- --webpack

echo "Checking Prisma migration status against the configured local database"
if command -v pg_isready >/dev/null 2>&1 && ! pg_isready -h localhost -p 5432 >/dev/null; then
  echo "Local PostgreSQL is not accepting connections on localhost:5432" >&2
  exit 1
fi
(
  cd apps/api
  ./node_modules/.bin/prisma migrate status
)

echo "Local release gate passed"
