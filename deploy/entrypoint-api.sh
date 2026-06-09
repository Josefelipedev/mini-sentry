#!/bin/sh
set -e
echo "[api] Starting server..."
exec node apps/api/dist/main.js
