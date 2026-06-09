#!/bin/sh
set -e

echo "[api] Applying database schema..."
node_modules/.bin/prisma db push --schema apps/api/prisma/schema.prisma --skip-generate --accept-data-loss

echo "[api] Starting server..."
exec node apps/api/dist/main.js
