#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
release_commit="$(git -C "$project_root" rev-parse --verify HEAD)"

echo "Building API container for $release_commit"
docker build \
  --build-arg "RELEASE_COMMIT=$release_commit" \
  --tag glacier-api:local \
  "$project_root/apps/api"

echo "Building web container for $release_commit"
docker build \
  --build-arg "RELEASE_COMMIT=$release_commit" \
  --build-arg "NEXT_PUBLIC_API_URL=https://api.invalid" \
  --build-arg "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_container_build_placeholder" \
  --tag glacier-web:local \
  "$project_root/apps/web"

for image in glacier-api:local glacier-web:local; do
  image_user="$(docker image inspect "$image" --format '{{.Config.User}}')"
  image_revision="$(docker image inspect "$image" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')"

  if [[ "$image_user" != "node" ]]; then
    echo "$image does not run as the expected non-root node user" >&2
    exit 1
  fi

  if [[ "$image_revision" != "$release_commit" ]]; then
    echo "$image does not record the expected release commit" >&2
    exit 1
  fi
done

echo "Container build verification passed"
