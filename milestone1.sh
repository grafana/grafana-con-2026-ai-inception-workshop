#!/bin/bash
set -e

PLUGIN_DIR="aiworkshop-bcapi-datasource"

if [ ! -d "$PLUGIN_DIR" ]; then
  echo ">>> Scaffolding plugin..."
  npx -y @grafana/create-plugin@latest --plugin-type=datasource --backend --plugin-name=bcapi --org-name=aiworkshop

  echo ">>> Pinning Grafana dependencies to 12.4.2..."
  cd "$PLUGIN_DIR"
  sed -i 's/"@grafana\/data": "[^"]*"/"@grafana\/data": "12.4.2"/' package.json
  sed -i 's/"@grafana\/i18n": "[^"]*"/"@grafana\/i18n": "12.4.2"/' package.json
  sed -i 's/"@grafana\/runtime": "[^"]*"/"@grafana\/runtime": "12.4.2"/' package.json
  sed -i 's/"@grafana\/ui": "[^"]*"/"@grafana\/ui": "12.4.2"/' package.json
  sed -i 's/"@grafana\/schema": "[^"]*"/"@grafana\/schema": "12.4.2"/' package.json
  cd ..
else
  echo ">>> Plugin directory already exists, skipping scaffold."
fi

echo ">>> Installing frontend dependencies (this will take a while)..."
cd "$PLUGIN_DIR"
docker compose down || true
npm install --no-audit --no-fund || true

echo ">>> Building backend..."
mage -v build:linux || true

# Overwrite docker-compose.yaml to enable development mode for backend auto-reload
echo ">>> Enabling development mode..."
cat > docker-compose.yaml <<'EOF'
services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
    build:
      args:
        development: "true"
EOF

echo ">>> Scaffolding of the plugin is complete."
