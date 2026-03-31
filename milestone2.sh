#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="aiworkshop-bcapi-app"
DS_DIR="aiworkshop-bcapi-datasource"
DS_PLUGIN_ID="aiworkshop-bcapi-datasource"

# Stop any running npm processes (npm run dev, npm run server)
echo ">>> Stopping running services..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "npm run server" 2>/dev/null || true
pkill -f "docker compose" 2>/dev/null || true
docker compose -f "$PROJECT_DIR/$DS_DIR/docker-compose.yaml" down 2>/dev/null || true

echo ">>> Building data source frontend..."
cd "$PROJECT_DIR/$DS_DIR"
npm run build

echo ">>> Building data source backend..."
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
cd "$PROJECT_DIR/$APP_DIR"
npm install --no-audit --no-fund

echo ">>> Building app frontend..."
npm run build

echo ">>> Building app backend..."
mage -v build:linux

# Overwrite docker-compose.yaml with volumes, env, and provisioning
echo ">>> Configuring docker-compose with datasource and provisioning..."
COMPOSE_FILE="$PROJECT_DIR/$APP_DIR/docker-compose.yaml"
cat > "$COMPOSE_FILE" <<EOF
services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
    build:
      args:
        development: "true"
    volumes:
      - ../$DS_DIR/dist:/var/lib/grafana/plugins/$DS_PLUGIN_ID
      - ./provisioning:/etc/grafana/provisioning
    environment:
      GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS: $DS_PLUGIN_ID,aiworkshop-bcapi-app
EOF

# Provision the data source
echo ">>> Provisioning data source..."
PROVISIONING_DIR="$PROJECT_DIR/$APP_DIR/provisioning/datasources"
mkdir -p "$PROVISIONING_DIR"
cat > "$PROVISIONING_DIR/bcapi.yaml" <<EOF
apiVersion: 1
datasources:
  - name: Barcelona Bicing
    type: $DS_PLUGIN_ID
    access: proxy
    isDefault: true
    jsonData:
      baseURL: https://cc-workshop-proxy.grafana.fun/bcapi/
    secureJsonData:
      apiKey: "barcelona2026"
EOF

echo ""
echo "============================================"
echo "  Milestone 2 setup complete!"
echo ""
echo "  Now run: cd $APP_DIR"
echo "============================================"
