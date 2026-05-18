#!/bin/bash
set -e

echo "=== Kairos Deploy ==="

if [ -z "$(command -v docker)" ]; then
    echo "Error: docker is not installed"
    exit 1
fi

if [ -z "$(command -v docker compose)" ] && [ -z "$(command -v docker-compose)" ]; then
    echo "Error: docker compose is not installed"
    exit 1
fi

if [ ! -f .env ]; then
    echo "Error: .env file not found. Copy .env.example to .env and fill in your values."
    exit 1
fi

echo "Building..."
docker compose build --no-cache

echo "Starting..."
docker compose up -d

echo "Done! App is running on port 80."
echo "Logs: docker compose logs -f"