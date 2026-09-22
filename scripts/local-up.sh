#!/bin/sh
set -e

cd "$(dirname "$0")/.."

docker compose --env-file .env.local -f docker-compose.local.yml up --build
