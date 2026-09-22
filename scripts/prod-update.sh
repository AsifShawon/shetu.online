#!/bin/sh
set -e

cd "$(dirname "$0")/.."

git pull --ff-only
docker compose --env-file .env.prod -f docker-compose.prod.yml build
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d mysql
docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm -e RUN_MIGRATIONS=false backend python manage.py migrate --noinput
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
