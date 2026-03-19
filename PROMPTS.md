# Workshop Prompts

This document contains the prompts used throughout the AI Inception workshop for building a Grafana plugin using AI.

## Data Source Development

### Creating the Data Source

```
Help me create a grafana data source for the barcelona Bicing API described in @../api.md The configuration should allow me to set a base API URL with default to https://cc-workshop-proxy.grafana.fun/bcapi/The query editor should let me select the API to hit (station status or station information). If information is selected the user should be able to select the station from a dropdown.The data source should use a backend component in go using the grafana go sdk.Make sure to read and follow the official grafana plugins documentation on how to build grafana plugins.
```

### Storing Knowledge

```
Store the essential information about the created datasource in AGENTS.md file
```

## App Development

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

## Advanced Features

### E2E Tests with Playwright

**Generate test plan:**
```
Generate a plan for testing of the bike stations list
```

**Generate tests:**
```
Generate tests for ###1.
```

**Fix tests:**
```
fix the test X
```

### Using LLM Package

```
Add an option in the map, when clicking in any point, it should use the @grafana/llm package to ask about the closest bicing station and requirements to use it
```
