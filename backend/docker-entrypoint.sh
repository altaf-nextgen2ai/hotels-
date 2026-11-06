#!/bin/sh
set -e

python manage.py migrate --noinput

if [ "${SEED_DATABASE:-0}" = "1" ]; then
  python seed_data.py || true
fi

exec "$@"
