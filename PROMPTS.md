# Workshop Prompts

This document contains the scaffolding steps and prompts used throughout the AI Inception workshop for building a Grafana plugin using AI.

## Milestone 1 - Data Source

> The initial scaffolding is handled automatically by `setup.sh` — start here after setup completes.

In terminal, navigate to the plugin directory and start the dev server:

```
cd aiworkshop-bcapi-datasource
npm run dev
```

This command will not finish and will keep running and watching for any changes to your plugin and rebuilding it automatically.

Now in a NEW terminal run:

```
cd aiworkshop-bcapi-datasource
npm run server
```

This command will also keep running as this is our Grafana server that we will be using. 
- Go to "Ports" tab, find the one which says "Grafana (3000)" and click the "Globe" 🌐︎ icon. This should take you to your grafana instance. 
- Now go to "Explore" and verify that you can see "bcapi" in the data source selector - it should display "No data" which is correct.

Great we have a new empty data source plugin scaffolded and it is working.

### Creating the Data Source

Now open yet another NEW terminal and make sure you are in the plugin directory:

```
cd aiworkshop-bcapi-datasource
claude
```

In **claude** we want to verify first that we are in the right folder. 

```
/skills
```

Should show you that you have 2 skills available. This is great no need to to anything just now we just want to make sure you are in the right place, if not check the folder you are in it should be `aiworkshop-bcapi-datasource`

Now in **claude** switch to plan mode by running

```
/plan
```

Here is our prompt:
```
Help me create a grafana data source for the barcelona Bicing API described in @../api.md The configuration should allow me to set a base API URL with default to https://cc-workshop-proxy.grafana.fun/bcapi/The query editor should let me select the API to hit (station status or station information). If information is selected the user should be able to select the station from a dropdown.The data source should use a backend component in go using the grafana go sdk.Make sure to read and follow the official grafana plugins documentation on how to build grafana plugins. Make sure the provisioned datasource has the correct api key configured.
```

At the end you will see a plan presented to your of what claude proposes it should be doing. If you are happy with the plan - accept it. The building of the plugin will take a while and it might ask you some questions in between - feel free to say yes to them.
Once done we want to verify that the plugin is working and can fetch data from the API. Before doing that make sure to restart the grafana server by going to the terminal that has the grafana server running, stop the process and then run the server again
```
npm run server
```

- Now go to "Ports" tab, find the one which says "Grafana (3000)" and click the "Globe" 🌐︎ icon. This should take you to your grafana instance. 
- Open Explore and hit "Run query" and you should see some data being fetched from the Api.

Awesome! You now have a actually working data source.


### Storing Knowledge
We want to make sure that next time claude runs it actually remembers the most important information about your data source. In **claude** run this prompt

```
Store the essential information about the created datasource in CLAUDE.md file
```

## Milestone 2 - Barcelona Biking App

### Scaffolding

```
cd ..
npx @grafana/create-plugin@latest

It will ask you:
"Select a plugin type": "App"
"Add a backend to support server-side functionality?" say yes / true
"Enter a name for your plugin": "bcapi"
"Enter your organization name (usually your Grafana Cloud org)": "aiworkshop"

npm install
```

### Symlinking the Data Source

```
I want to add dist folder of ../aiworkshop-bcapi-datasource plugin to volumes of this plugin so that when I start this app plugin it has the datasource installed. Also add it to run unsigned.
```

### Provisioning the Data Source

```
I want to provision the aiworkshop-bcapi-datasource plugin to connect to https://cc-workshop-proxy.grafana.fun/bcapi/ you can see the details of the api in @../api.md
```

### Building the App Interface

```
Help me modify this grafana app plugin so we have only 1 page in the navigation menu. The page should allow me to select the bicing data source on top (default to first found) and let me see the list of stations in a list. Make it so I can see the details of a station when I put my mouse over each element.
```

### Adding Map View

```
Create a second page in the bicing app that I can access via the navigation menu too where I can see a map of all the stations with tooltip details. Use react map gl and openfreemap
```

## Milestone 3 - Advanced Features

### Using LLM Package

```
Add an option in the map, when clicking in any point, it should use the @grafana/llm package to ask about the closest bicing station and requirements to use it. Use a synchronous non-streaming api.
```
