#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="aiworkshop-bcapi-app"

# Stop any running npm processes (npm run dev, npm run server)
echo ">>> Stopping running services..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "npm run server" 2>/dev/null || true
pkill -f "docker compose" 2>/dev/null || true
docker compose -f "$PROJECT_DIR/aiworkshop-bcapi-datasource/docker-compose.yaml" down 2>/dev/null || true

echo ">>> Building data source dist for symlinking..."
cd "$PROJECT_DIR/aiworkshop-bcapi-datasource"
mage -v build:linux
cd "$PROJECT_DIR"

# Scaffold app plugin
if [ ! -d "$APP_DIR" ]; then
  echo ">>> Scaffolding app plugin..."
  npx -y @grafana/create-plugin@latest --plugin-type=app --backend --plugin-name=bcapi --org-name=aiworkshop
else
  echo ">>> App plugin directory already exists, skipping scaffold."
fi

echo ">>> Installing frontend dependencies (this will take a while)..."
cd "$APP_DIR"
npm install --no-audit --no-fund

echo ""
echo "============================================"
echo "  Milestone 2 setup complete!"
echo ""
echo "  Now run: cd $APP_DIR"
echo "============================================"
