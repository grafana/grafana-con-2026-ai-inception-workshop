#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="aiworkshop-bcapi-app"

# Fail if run from inside the datasource plugin directory
if [[ "$(pwd)" == *"aiworkshop-bcapi-datasource"* ]]; then
  echo "ERROR: Do not run this script from inside the datasource plugin directory."
  echo "Please run from the workshop root: $PROJECT_DIR"
  exit 1
fi
DS_DIR="aiworkshop-bcapi-datasource"
DS_PLUGIN_ID="aiworkshop-bcapi-datasource"

# Stop any running npm processes (npm run dev, npm run server)
echo ">>> Stopping running services..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "npm run server" 2>/dev/null || true
pkill -f "docker compose" 2>/dev/null || true
docker compose -f "$PROJECT_DIR/$DS_DIR/docker-compose.yaml" down 2>/dev/null || true

echo ">>> Installing data source dependencies..."
cd "$PROJECT_DIR/$DS_DIR"
npm install --no-audit --no-fund || true

echo ">>> Building data source frontend..."
npm run build || true

echo ">>> Building data source backend..."
mage -v build:linux || true
cd "$PROJECT_DIR"

# Scaffold app plugin
if [ ! -d "$APP_DIR" ]; then
  echo ">>> Scaffolding app plugin..."
  npx -y @grafana/create-plugin@latest --plugin-type=app --backend --plugin-name=bcapi --org-name=aiworkshop

  echo ">>> Pinning Grafana dependencies to 12.4.2..."
  cd "$PROJECT_DIR/$APP_DIR"
  sed -i 's/"@grafana\/data": "[^"]*"/"@grafana\/data": "12.4.2"/' package.json
  sed -i 's/"@grafana\/i18n": "[^"]*"/"@grafana\/i18n": "12.4.2"/' package.json
  sed -i 's/"@grafana\/runtime": "[^"]*"/"@grafana\/runtime": "12.4.2"/' package.json
  sed -i 's/"@grafana\/ui": "[^"]*"/"@grafana\/ui": "12.4.2"/' package.json
  sed -i 's/"@grafana\/schema": "[^"]*"/"@grafana\/schema": "12.4.2"/' package.json
else
  echo ">>> App plugin directory already exists, skipping scaffold."
fi

echo ">>> Installing frontend dependencies (this will take a while)..."
cd "$PROJECT_DIR/$APP_DIR"
npm install --no-audit --no-fund || true

echo ">>> Building app frontend..."
npm run build || true

echo ">>> Building app backend..."
mage -v build:linux || true

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
