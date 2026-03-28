# Additional Challenges

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
