## Project knowledge

This repository contains a **Grafana plugin**. You must Read @./.config/AGENTS/instructions.md before doing changes.

## Plugin overview

- **Plugin ID**: `aiworkshop-bcapi-app`
- **Plugin type**: App
- **Name**: Bcapi
- **Grafana dependency**: >=12.3.0
- **Companion data source**: `aiworkshop-bcapi-datasource` (separate plugin, used to fetch station data)

## Authentication and configuration

The app is configured via the Grafana plugin settings page (`/plugins/aiworkshop-bcapi-app`):
- **`jsonData.apiUrl`** — URL of the external API (non-sensitive, stored in `jsonData`)
- **`secureJsonData.apiKey`** — Secret API key (stored in `secureJsonData`, not readable by the frontend after save)

## Pages and routes

| Route | Page | Description |
|---|---|---|
| `/a/aiworkshop-bcapi-app/stations` | StationsPage | Default page. Lists all bike stations with name, address, and live availability. Hover tooltip shows full details. |
| `/a/aiworkshop-bcapi-app/map` | MapPage | Interactive map (MapLibre GL + OpenFreeMap tiles) showing station locations as clustered GeoJSON points. Click a station for a popup with details. |

## Data model

The app queries the companion data source (`aiworkshop-bcapi-datasource`) for two endpoints:
- **`station_information`** — returns `StationInfo[]` (station_id, name, lat/lng, address, capacity, physical_configuration, is_charging_station, etc.)
- **`station_status`** — returns `StationStatus[]` (station_id, num_bikes_available, mechanical, ebike, num_docks_available, status, last_reported, etc.)

These are merged client-side by `station_id` into a `Station` object (see `src/types.ts` and `src/hooks/useStations.ts`).

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
