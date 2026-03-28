# Workshop Prompts

This document contains the scaffolding steps and prompts used throughout the AI Inception workshop for building a Grafana plugin using AI.

<a id="milestone-1"></a>
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

Great now we can move on to building the next plugin - a biking app that is going to use the data source you just created to visualize the bicing api data.

<a id="milestone-2"></a>
## Milestone 2 - Barcelona Biking App

### Setup

```
cd $CODESPACE_VSCODE_FOLDER
bash milestone2.sh
```

This will stop running services, build the data source, scaffold the app plugin, install dependencies, symlink the data source, and provision it.

You can now close the old terminal tabs (the ones that were running `npm run dev` and `npm run server`) — the processes have been stopped.

### Building the App Interface

Navigate to the app plugin directory and start the dev server and Grafana in separate terminals:

```
cd aiworkshop-bcapi-app
npm run dev
```

In a NEW terminal:

```
cd aiworkshop-bcapi-app
npm run server
```

In yet another NEW terminal, start claude:

```
cd aiworkshop-bcapi-app
claude
```

Verify you are in the right folder by running:

```
/skills
```

Should show you that you have 2 skills available. Now switch to plan mode:

```
/plan
```

Here is our prompt:
```
Help me modify this grafana app plugin so we have only 1 page in the navigation menu. The page should allow me to select the bicing data source on top (default to first found) and let me see the list of stations in a list. Make it so I can see the details of a station when I put my mouse over each element.
```

Review the plan and accept it if you are happy with it.

Once done, verify the app is working:
- Go to "Ports" tab, find "Grafana (3000)" and click the "Globe" icon to open your Grafana instance.
- Navigate to the Bicing app page — you should see a list of stations with details appearing on hover.

### Adding Map View

```
Create a second page in the bicing app that I can access via the navigation menu too where I can see a map of all the stations with tooltip details. Use react map gl and openfreemap
```

<a id="milestone-3"></a>
## Milestone 3 - Advanced Features

### Using LLM Package

```
Add an option in the map, when clicking in any point, it should use the @grafana/llm package to ask about the closest bicing station and requirements to use it. Use a synchronous non-streaming api.
```

Once this is done, you can prompt it to

```
Make sure the grafana-llm-app is automatically installed in my app project
```

Now restart the Grafana server and got o "Administration -> Plugins and data -> Plugins" and search for LLM plugin that should now be installed. Click on it and go to "Configuration" and setup OpenAI or Anthropic API configuration. You can ask us for a demo key you can use.

You can now modify the App views - anything you want to change on the map, prompt it to modify the behavior when an option on the map is clicked or whatever you wish, claude will help you out.

---

## Congratulations!

You've just built two Grafana plugins entirely with AI assistance:

- **A data source plugin** that connects to a live Barcelona Bicing API, with a Go backend and a query editor with station selection
- **An app plugin** with a station list view, an interactive map, and AI-powered station insights using the LLM package

All of this — backend logic, frontend components, API integration, Docker configuration, and provisioning — was generated through natural language prompts.

---

Finished all milestones? Check out the **[Additional Challenges](additional-challenges.md)** for more ideas to extend your plugin.

