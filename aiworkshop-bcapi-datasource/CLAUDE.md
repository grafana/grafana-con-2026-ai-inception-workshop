## Project knowledge

This repository contains a **Grafana plugin**. You must Read @./.config/AGENTS/instructions.md before doing changes.

## Plugin overview

- **Plugin ID:** `aiworkshop-bcapi-datasource`
- **Type:** Datasource (with backend)
- **Name:** Bcapi
- **Executable:** `gpx_bcapi`
- **Min Grafana version:** >=12.3.0

This plugin connects to the **Bicing bike-sharing API** (Barcelona's public bike system) and exposes station data inside Grafana.

## API connection

- **Base URL:** Configured per-instance via `jsonData.baseURL` (e.g. `https://cc-workshop-proxy.grafana.fun/bcapi/`)
- **Authentication:** Bearer token — API key stored in `secureJsonData.apiKey`, sent as `Authorization: Bearer {apiKey}` header
- **Upstream endpoints consumed:**
  - `GET {baseURL}/station_information` — static station metadata (name, location, capacity)
  - `GET {baseURL}/station_status` — real-time availability (bikes, docks, status)

## Supported query types

Queries are defined by an `endpoint` field and an optional `stationId` filter:

| Endpoint | Description | Fields returned |
|---|---|---|
| `station_status` (default) | Real-time station availability | station_id, num_bikes_available, mechanical, ebike, num_docks_available, num_bikes_disabled, num_docks_disabled, status, last_reported |
| `station_information` | Static station metadata (supports optional `stationId` filter) | station_id, name, latitude, longitude, altitude, address, cross_street, post_code, capacity, physical_configuration, is_charging_station |

## Backend resource handlers

The backend exposes one resource route used by the query editor UI:

- `GET /stations` — returns a list of `{value, label}` objects for the station dropdown, sourced from the `/station_information` upstream endpoint.

## Key files

| Path | Purpose |
|---|---|
| `src/plugin.json` | Plugin metadata |
| `src/types.ts` | TypeScript interfaces (MyQuery, MyDataSourceOptions, MySecureJsonData) |
| `src/datasource.ts` | Frontend datasource class |
| `src/components/ConfigEditor.tsx` | Config UI (baseURL + API key) |
| `src/components/QueryEditor.tsx` | Query UI (endpoint selector + station filter) |
| `pkg/plugin/datasource.go` | Backend: query execution, API calls, resource handler |
| `pkg/models/settings.go` | Backend settings model (baseURL, apiKey) |
