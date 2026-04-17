# Additional Challenges

> **Note:** Challenges that use `@grafana/llm` (Landmark-Aware Station Chat, Station Recommendations via LLM, Natural Language Queries) require **Milestone 3** to be completed first — the LLM plugin must be installed and provisioned. If you haven't done Milestone 3 yet, either complete it first or switch to the `milestone3-completed` branch.

## Using the scaffolded skills

Your scaffolded plugins ship with Claude Code skills and agent instructions that apply to every challenge below — not just E2E. Run Claude Code from **inside the plugin folder** to use them.

Slash commands:

- `/build-plugin` — builds the frontend (and backend via mage, if the plugin has one). Use this after a round of changes instead of trying to remember the right `npm` / `mage` invocation.
- `/validate-plugin` — packages the plugin and runs the official Grafana plugin validator. Run this after finishing a challenge as a quick sanity check that you haven't broken anything.

Agent instructions (loaded automatically — no action needed):

- `.config/AGENTS/instructions.md` — core Grafana plugin rules (uses the latest grafana.com docs, `secureJsonData` for secrets, don't modify `.config/`, etc.).
- `.config/AGENTS/e2e-testing.md` — referenced explicitly in the E2E challenge below.

## E2E Testing with @grafana/plugin-e2e

Your scaffolded plugins already come with `@grafana/plugin-e2e`, Playwright, and agent instructions in `.config/AGENTS/e2e-testing.md` that teach Claude how to write idiomatic e2e tests.

### Writing tests

Prompt Claude to write e2e tests. It will follow the agent instructions automatically. Some ideas:

**Data source plugin:**
```
Write e2e tests for the bcapi data source plugin. Test that:
- The config editor saves successfully with a valid API URL
- A query for station_status returns data
- A query for station_information returns station details
Make sure to read @.config/AGENTS/e2e-testing.md before writing the tests.
```

**App plugin:**
```
Write e2e tests for the bicing app plugin. Test that:
- The station list page loads and displays stations
- Hovering over a station shows details
- The map page loads and shows station markers
Make sure to read @.config/AGENTS/e2e-testing.md before writing the tests.
```

### Running tests

```bash
# Terminal 1 - start Grafana
npm run server

# Terminal 2 - run the tests
npm run e2e
```

## On-Demand Loading and Pagination

The app probably loads all station information at once. Make it smarter by loading details on demand and adding pagination to the list.

```
Refactor the station list page so it does not load all station information upfront.
Add pagination to the station list.
Load station details on demand only when the user hovers over or selects a station.
```

## Color-Coded Map Markers

Make the map instantly tell you where bikes are available by coloring markers based on availability.

```
Update the map markers so they are color-coded based on bike availability:
- Green when more than 50% of docks have bikes available
- Orange when 20-50% have bikes available
- Red when less than 20% have bikes available
Also make the marker size reflect the station capacity.
```

## Dark Mode Map

Make the map respect Grafana's theme so it looks great in both light and dark mode.

```
Make the map tiles switch style based on the current Grafana theme.
Use a dark map style when Grafana is in dark mode and a light style when in light mode.
The map should update automatically when the user switches themes.
```

## Landmark-Aware Station Chat

Add a sidebar chat panel that lets users ask questions like "are there bike stations near the Sagrada Família?" or "where can I find e-bikes near Barceloneta beach?".

The chat should use the `@grafana/llm` package with **tool calling** so the LLM can actively look up information rather than guessing:
- A **geocoding tool** that resolves place names to coordinates using the [Nominatim API](https://nominatim.org/release-docs/latest/api/Search/) (free, no key required — `GET https://nominatim.openstreetmap.org/search?q=<place>&format=json`)
- A **station lookup tool** that finds stations within a given radius of a lat/lon using the station data already loaded in the app

The LLM decides when to call each tool and uses the results to give a grounded, accurate answer.

Useful references:
- [`@grafana/llm` package on npm](https://www.npmjs.com/package/@grafana/llm) — tool calling types and chat API
- [Nominatim search docs](https://nominatim.org/release-docs/latest/api/Search/) — query by place name, returns lat/lon
- [Nominatim reverse geocoding docs](https://nominatim.org/release-docs/latest/api/Reverse/) — query by lat/lon, returns address/neighborhood

```
Add a sidebar chat panel to the app. Users should be able to ask questions about bike
stations near landmarks or places in Barcelona, for example "are there stations near
Park Güell?" or "find e-bikes near the beach".

Use the @grafana/llm package with tool calling. Give the LLM two tools:
1. A geocoding tool that uses the Nominatim API to resolve a place name to coordinates
2. A station search tool that finds the closest stations to given coordinates from the
   already-loaded station data

The LLM should call the tools as needed and use the results to answer the user's question.
Use a non-streaming chat API.
```

## Natural Language Queries

Let users ask questions about station data in plain English and get answers directly in the app.

```
Add a chat-style input to the station list page where users can ask questions about the data in natural language, for example "which stations have the most e-bikes right now?" or "are there any stations with no bikes available?". Use the @grafana/llm package to interpret the question, query the station data, and display the answer inline below the input.
```

## Station Search and Filter

Add a quick way to find specific stations without scrolling through the full list.

```
Add a search bar at the top of the station list page that filters stations in real time as the user types. It should match against station name, address, and district. Also add filter toggles to show only stations that have bikes available, only e-bike stations, or only stations that are currently in service.
```

## Hot reload plugins

Can you get the app and data source plugins to reload on changes?
