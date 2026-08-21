#!/usr/bin/env sh
set -eu

if [ -n "${APP_KEY:-}" ]; then
  php artisan config:cache
fi

php artisan view:cache

php -S 0.0.0.0:${PORT:-10000} -t public
