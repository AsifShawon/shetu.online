#!/bin/sh
set -e

cd "$(dirname "$0")/.."

docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
