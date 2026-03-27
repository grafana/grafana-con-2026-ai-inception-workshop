#!/bin/bash
set -e

PLUGIN_DIR="aiworkshop-bcapi-datasource"

if [ ! -d "$PLUGIN_DIR" ]; then
  npx @grafana/create-plugin@latest --plugin-type=datasource --backend --plugin-name=bcapi --org-name=aiworkshop
fi

cd "$PLUGIN_DIR"

npm ci --no-audit --no-fund

mage -v build:linux
