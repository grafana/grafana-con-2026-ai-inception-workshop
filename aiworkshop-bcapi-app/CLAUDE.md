## Project knowledge

This repository contains a **Grafana plugin**. You must Read @./.config/AGENTS/instructions.md before doing changes.

## Plugin overview

- **Plugin ID**: `aiworkshop-bcapi-app`
- **Plugin type**: App
- **Name**: Bcapi
- **Grafana dependency**: >=12.3.0
- **Companion data source**: `aiworkshop-bcapi-datasource` (separate plugin, used to fetch station data)

## Authentication and configuration

The app is configured via the Grafana plugin settings page (`/plugins/aiworkshop-bcapi-app`).
Settings are saved via `POST /api/plugins/aiworkshop-bcapi-app/settings` and require a page reload to take effect.

| Setting | Storage | Description |
|---|---|---|
| `jsonData.apiUrl` | `jsonData` (non-sensitive) | URL of the external bike-share API |
| `secureJsonData.apiKey` | `secureJsonData` (write-only) | Secret API key — not readable by the frontend after save |

**Authentication method**: API key stored in Grafana's `secureJsonData`. The companion data source backend proxies requests to the external API and attaches the key; the frontend never handles the secret directly.

## Pages and routes

| Route | Page | Description |
|---|---|---|
| `/a/aiworkshop-bcapi-app/stations` | StationsPage | Default page. Lists all bike stations with name, address, and live availability. Hover tooltip shows full details. |
| `/a/aiworkshop-bcapi-app/map` | MapPage | Interactive map (MapLibre GL + OpenFreeMap tiles) showing station locations as clustered GeoJSON points. Click a station for a popup with details. |

## Supported query types and data model

The frontend queries the companion data source (`aiworkshop-bcapi-datasource`, plugin ID: `aiworkshop-bcapi-datasource`) using Grafana's `DataSourceSrv`. Each page includes a `DataSourcePicker` filtered to this plugin ID so the user can select which data source instance to use.

Queries are issued via `ds.query()` with a `targets` array containing `{ refId, endpoint }`. Two endpoint values are supported:

| Endpoint value | Returns | Key fields |
|---|---|---|
| `station_information` | `StationInfo[]` | station_id, name, latitude, longitude, altitude, address, cross_street, post_code, capacity, physical_configuration, is_charging_station |
| `station_status` | `StationStatus[]` | station_id, num_bikes_available, mechanical, ebike, num_docks_available, num_bikes_disabled, num_docks_disabled, status, last_reported |

Both queries use a dummy time range (`now` to `now`) since the data is live/current, not time-series.

The `useStations` hook (`src/hooks/useStations.ts`) fires both queries in parallel, parses the returned DataFrames into typed arrays, and merges them by `station_id` into `Station` objects (`{ info: StationInfo, status?: StationStatus }`).

## Key source files

| File | Purpose |
|---|---|
| `src/plugin.json` | Plugin manifest (ID, type, pages, nav) |
| `src/module.tsx` | Plugin entry point — registers root page and config page |
| `src/constants.ts` | Route enum and base URL |
| `src/types.ts` | TypeScript interfaces for StationInfo, StationStatus, Station |
| `src/hooks/useStations.ts` | React hook that queries the data source and merges station info + status |
| `src/pages/StationsPage.tsx` | Station list page |
| `src/pages/MapPage.tsx` | Map visualization page |
| `src/components/AppConfig/AppConfig.tsx` | Plugin configuration page (API URL + API key) |
| `src/components/App/App.tsx` | Router — maps routes to pages |
