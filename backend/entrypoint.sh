#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  until python manage.py migrate --noinput; do
    echo "Database is unavailable, retrying in 2 seconds..."
    sleep 2
  done
fi

if [ "${SEED_BASIC_CATALOG:-false}" = "true" ]; then
  python manage.py seed_basic_catalog
fi

exec "$@"
