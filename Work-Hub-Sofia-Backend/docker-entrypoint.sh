#!/bin/sh
set -eu

SEED_MARKER="/var/lib/workhub/.seed-complete"

if [ "${RUN_SEED_ON_START:-true}" = "true" ] && [ ! -f "$SEED_MARKER" ]; then
  echo "Initialisation de la base et execution du seed..."
  node dist/seeds/seed-database.js
  mkdir -p "$(dirname "$SEED_MARKER")"
  touch "$SEED_MARKER"
  echo "Seed initial termine."
else
  echo "Seed deja execute ou desactive."
fi

exec node dist/main.js
