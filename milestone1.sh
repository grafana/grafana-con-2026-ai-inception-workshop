#!/bin/bash
set -e

PLUGIN_DIR="aiworkshop-bcapi-datasource"

if [ ! -d "$PLUGIN_DIR" ]; then
  echo ">>> Scaffolding plugin..."
  npx -y @grafana/create-plugin@latest --plugin-type=datasource --backend --plugin-name=bcapi --org-name=aiworkshop
else
  echo ">>> Plugin directory already exists, skipping scaffold."
fi

echo ">>> Installing frontend dependencies (this will take a while)..."
cd "$PLUGIN_DIR"
npm install --no-audit --no-fund

echo ">>> Building backend..."
mage -v build:linux

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
