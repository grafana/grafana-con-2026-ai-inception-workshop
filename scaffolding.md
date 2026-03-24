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
