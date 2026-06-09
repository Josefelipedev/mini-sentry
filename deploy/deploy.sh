#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

echo "▶ Atualizando código..."
git pull origin main

echo "▶ Verificando .env.prod..."
if [ ! -f deploy/.env.prod ]; then
  echo "❌ deploy/.env.prod não encontrado."
  echo "   Copie o exemplo: cp deploy/.env.prod.example deploy/.env.prod"
  echo "   Edite as credenciais e execute novamente."
  exit 1
fi

echo "▶ Build e subindo containers..."
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

echo "▶ Aguardando API iniciar..."
sleep 5
docker compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deploy concluído!"
echo "   Dashboard: https://logs.thechats.me"
echo "   API:       https://logs.thechats.me/api/v1/projects"
