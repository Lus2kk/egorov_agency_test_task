#!/bin/sh
mkdir -p /var/run/nginx
nginx
exec /app/backend