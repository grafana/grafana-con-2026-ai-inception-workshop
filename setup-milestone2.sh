#!/bin/bash
set -e

# Stop any running npm processes (npm run dev, npm run server)
echo ">>> Stopping running services..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "npm run server" 2>/dev/null || true
pkill -f "docker compose" 2>/dev/null || true
docker compose -f aiworkshop-bcapi-datasource/docker-compose.yaml down 2>/dev/null || true

echo ">>> Building data source dist for symlinking..."
cd aiworkshop-bcapi-datasource
mage -v build:linux
cd ..

echo ">>> Services stopped. Ready for milestone 2."
