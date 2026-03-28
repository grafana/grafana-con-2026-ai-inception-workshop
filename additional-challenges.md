# Additional Challenges

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

## Station Recommendations via LLM

Add a natural language search — type what you need and let AI find the right station.

```
Add a text input at the top of the map page where users can describe what they are looking for in natural language, for example "find me a station near the beach with e-bikes available". Use the @grafana/llm package to interpret the request, match it against the station data, and highlight the best matching stations on the map.
```

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
