## First milestone - get scaffolded data source working

Only copy one line at a time

```
npx @grafana/create-plugin@latest

It will ask you:
"Select a plugin type": "Data source"
“Add a backend to support server-side functionality?” say yes / true
"Enter a name for your plugin": “bcapi”
"Enter your organization name (usually your Grafana Cloud org)": "aiworkshop"

cd ./aiworkshop-bcapi-datasource
npm install
mage -v build:linux
npm run dev
npm run server
```

## Third milestone: building the barcelona biking app 

```
cd ..
npx @grafana/create-plugin@latest

It will ask you:
"Select a plugin type": "App"
“Add a backend to support server-side functionality?” say yes / true
"Enter a name for your plugin": “bcapi”
"Enter your organization name (usually your Grafana Cloud org)": "aiworkshop"

npm install
```