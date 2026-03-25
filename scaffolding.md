## First milestone - get scaffolded data source working

```
yarn dlx @grafana/create-plugin@latest

"Select a plugin type": "Data source"
“Add a backend to support server-side functionality?” say yes / true
"Enter a name for your plugin": “bcapi”
"Enter your organization name (usually your Grafana Cloud org)": "aiworkshop"

cd ./aiworkshop-bcapi-datasource
yarn install
mage build:linux
yarn dev
yarn server
```

## Third milestone: building the barcelona biking app 

```
cd ..
yarn dlx @grafana/create-plugin@latest

"Select a plugin type": "App"
“Add a backend to support server-side functionality?” say yes / true
"Enter a name for your plugin": “bcapi”
"Enter your organization name (usually your Grafana Cloud org)": "aiworkshop"

yarn install
```

## Add e2e tests using playwright or Chrome DevTools MCP
In your "app" folder run

```
yarn dlx playwright init-agents --loop=claude
/agents
playwright-test-planner - Prompt: Generate a plan for testing of the bike stations list

Once the plan is in place in specs folder

playwright-test-generator - Prompt: ”Generate tests for ###1.”

yarn e2e
yarn dlx playwright show-report
(if needed) playwright-test-healer: “Prompt: fix the test X”
```