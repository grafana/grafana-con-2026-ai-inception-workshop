## Barcelona Bicing API

A live API with real-time data from Barcelona's public bike-sharing system (Bicing) is available at:

```
https://cc-workshop-proxy.grafana.fun/bcapi/
```

All requests require an `Authorization` header:

```
Authorization: Bearer barcelona2026
```

### Endpoints

#### `GET /bcapi/station_information`

Returns static information for all bike stations.

```bash
curl -H "Authorization: Bearer barcelona2026" -s https://cc-workshop-proxy.grafana.fun/bcapi/station_information
```

Each station includes:

| Field | Type | Description |
|---|---|---|
| `station_id` | string | Unique station ID |
| `name` | string | Station name (e.g. `"GRAN VIA CORTS CATALANES, 760"`) |
| `lat`, `lon` | float | GPS coordinates |
| `altitude` | float | Elevation in meters |
| `address` | string | Street address |
| `cross_street` | string | District/neighborhood |
| `post_code` | string | Postal code |
| `capacity` | int | Total number of docks |
| `physical_configuration` | string | e.g. `"ELECTRICBIKESTATION"` |
| `is_charging_station` | bool | Whether the station supports e-bike charging |
| `rental_methods` | array | e.g. `["key","transitcard","creditcard","phone"]` |

#### `GET /bcapi/station_status`

Returns real-time availability for all stations.

```bash
curl -s https://cc-workshop-proxy.grafana.fun/bcapi/station_status
```

Each station includes:

| Field | Type | Description |
|---|---|---|
| `station_id` | string | Matches `station_information` |
| `num_bikes_available` | int | Total available bikes |
| `num_bikes_available_types` | object | Breakdown: `{"mechanical": N, "ebike": N}` |
| `num_docks_available` | int | Free docks |
| `num_bikes_disabled` | int | Out-of-service bikes |
| `num_docks_disabled` | int | Out-of-service docks |
| `status` | string | e.g. `"IN_SERVICE"` |
| `is_installed` | int | 1 if physically installed |
| `is_renting` | int | 1 if accepting rentals |
| `is_returning` | int | 1 if accepting returns |
| `last_reported` | int | Unix timestamp of last update |

### Response Wrapper

Both endpoints return data in this structure:

```json
{
  "last_updated": 1773391285,
  "ttl": 0,
  "data": {
    "stations": [ ... ]
  }
}
```
