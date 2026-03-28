# Additional Challenges

## E2E Testing with @grafana/plugin-e2e

Your scaffolded plugins already come with `@grafana/plugin-e2e` and Playwright set up. A new PR ([plugin-tools#2478](https://github.com/grafana/plugin-tools/pull/2478)) adds agentic instructions that teach Claude how to write idiomatic e2e tests using the `@grafana/plugin-e2e` API instead of raw Playwright.

### Setup

First, grab the agent instructions file and place it in your plugin's `.config/AGENTS/` directory:

```
mkdir -p .config/AGENTS
curl -sL "https://raw.githubusercontent.com/grafana/plugin-tools/create-plugin/e2e-agents/packages/create-plugin/templates/common/.config/AGENTS/e2e-testing.md" -o .config/AGENTS/e2e-testing.md
```

### Writing tests

Now prompt Claude to write e2e tests. It will follow the instructions in the agent file automatically. Some ideas:

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
