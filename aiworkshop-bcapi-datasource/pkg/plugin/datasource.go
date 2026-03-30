package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
	"github.com/grafana/grafana-plugin-sdk-go/data"

	"github.com/aiworkshop/bcapi/pkg/models"
)

var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ backend.CallResourceHandler   = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

func NewDatasource(_ context.Context, s backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	settings, err := models.LoadPluginSettings(s)
	if err != nil {
		return nil, fmt.Errorf("load settings: %w", err)
	}

	d := &Datasource{
		httpClient: &http.Client{Timeout: 30 * time.Second},
		settings:   settings,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/stations", d.handleStations)
	d.resourceHandler = httpadapter.New(mux)

	return d, nil
}

type Datasource struct {
	httpClient      *http.Client
	settings        *models.PluginSettings
	resourceHandler backend.CallResourceHandler
}

func (d *Datasource) Dispose() {}

func (d *Datasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	return d.resourceHandler.CallResource(ctx, req, sender)
}

// doAPIRequest makes a request to the Bicing API with the bearer token.
func (d *Datasource) doAPIRequest(ctx context.Context, endpoint string) ([]byte, error) {
	baseURL := strings.TrimRight(d.settings.BaseURL, "/")
	url := baseURL + "/" + strings.TrimLeft(endpoint, "/")

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+d.settings.Secrets.ApiKey)

	resp, err := d.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read body: %w", err)
	}
	return body, nil
}

// API response types
type apiResponse struct {
	LastUpdated int64           `json:"last_updated"`
	TTL         int             `json:"ttl"`
	Data        apiResponseData `json:"data"`
}

type apiResponseData struct {
	Stations []json.RawMessage `json:"stations"`
}

type stationInfo struct {
	StationID             string   `json:"station_id"`
	Name                  string   `json:"name"`
	Lat                   float64  `json:"lat"`
	Lon                   float64  `json:"lon"`
	Altitude              float64  `json:"altitude"`
	Address               string   `json:"address"`
	CrossStreet           string   `json:"cross_street"`
	PostCode              string   `json:"post_code"`
	Capacity              int64    `json:"capacity"`
	PhysicalConfiguration string   `json:"physical_configuration"`
	IsChargingStation     bool     `json:"is_charging_station"`
	RentalMethods         []string `json:"rental_methods"`
}

type bikeTypes struct {
	Mechanical int64 `json:"mechanical"`
	Ebike      int64 `json:"ebike"`
}

type stationStatus struct {
	StationID             string    `json:"station_id"`
	NumBikesAvailable     int64     `json:"num_bikes_available"`
	NumBikesAvailableTypes bikeTypes `json:"num_bikes_available_types"`
	NumDocksAvailable     int64     `json:"num_docks_available"`
	NumBikesDisabled      int64     `json:"num_bikes_disabled"`
	NumDocksDisabled      int64     `json:"num_docks_disabled"`
	Status                string    `json:"status"`
	IsInstalled           int64     `json:"is_installed"`
	IsRenting             int64     `json:"is_renting"`
	IsReturning           int64     `json:"is_returning"`
	LastReported          int64     `json:"last_reported"`
}

type stationOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

func (d *Datasource) handleStations(w http.ResponseWriter, r *http.Request) {
	body, err := d.doAPIRequest(r.Context(), "station_information")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var apiResp apiResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		http.Error(w, "parse response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	options := make([]stationOption, 0, len(apiResp.Data.Stations))
	for _, raw := range apiResp.Data.Stations {
		var s stationInfo
		if err := json.Unmarshal(raw, &s); err != nil {
			continue
		}
		options = append(options, stationOption{
			Value: s.StationID,
			Label: s.Name + " (" + s.StationID + ")",
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(options)
}

type queryModel struct {
	Endpoint  string `json:"endpoint"`
	StationID string `json:"stationId"`
}

func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	response := backend.NewQueryDataResponse()
	for _, q := range req.Queries {
		response.Responses[q.RefID] = d.query(ctx, q)
	}
	return response, nil
}

func (d *Datasource) query(ctx context.Context, query backend.DataQuery) backend.DataResponse {
	var qm queryModel
	if err := json.Unmarshal(query.JSON, &qm); err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, "json unmarshal: "+err.Error())
	}

	if qm.Endpoint == "" {
		qm.Endpoint = "station_status"
	}

	body, err := d.doAPIRequest(ctx, qm.Endpoint)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusInternal, "api request: "+err.Error())
	}

	var apiResp apiResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		return backend.ErrDataResponse(backend.StatusInternal, "parse response: "+err.Error())
	}

	switch qm.Endpoint {
	case "station_information":
		return d.buildStationInfoFrame(apiResp.Data.Stations, qm.StationID)
	case "station_status":
		return d.buildStationStatusFrame(apiResp.Data.Stations)
	default:
		return backend.ErrDataResponse(backend.StatusBadRequest, "unknown endpoint: "+qm.Endpoint)
	}
}

func (d *Datasource) buildStationInfoFrame(rawStations []json.RawMessage, filterStationID string) backend.DataResponse {
	stations := make([]stationInfo, 0, len(rawStations))
	for _, raw := range rawStations {
		var s stationInfo
		if err := json.Unmarshal(raw, &s); err != nil {
			continue
		}
		if filterStationID != "" && s.StationID != filterStationID {
			continue
		}
		stations = append(stations, s)
	}

	frame := data.NewFrame("station_information")

	stationIDs := make([]string, len(stations))
	names := make([]string, len(stations))
	lats := make([]float64, len(stations))
	lons := make([]float64, len(stations))
	altitudes := make([]float64, len(stations))
	addresses := make([]string, len(stations))
	crossStreets := make([]string, len(stations))
	postCodes := make([]string, len(stations))
	capacities := make([]int64, len(stations))
	configs := make([]string, len(stations))
	charging := make([]bool, len(stations))

	for i, s := range stations {
		stationIDs[i] = s.StationID
		names[i] = s.Name
		lats[i] = s.Lat
		lons[i] = s.Lon
		altitudes[i] = s.Altitude
		addresses[i] = s.Address
		crossStreets[i] = s.CrossStreet
		postCodes[i] = s.PostCode
		capacities[i] = s.Capacity
		configs[i] = s.PhysicalConfiguration
		charging[i] = s.IsChargingStation
	}

	frame.Fields = append(frame.Fields,
		data.NewField("station_id", nil, stationIDs),
		data.NewField("name", nil, names),
		data.NewField("latitude", nil, lats),
		data.NewField("longitude", nil, lons),
		data.NewField("altitude", nil, altitudes),
		data.NewField("address", nil, addresses),
		data.NewField("cross_street", nil, crossStreets),
		data.NewField("post_code", nil, postCodes),
		data.NewField("capacity", nil, capacities),
		data.NewField("physical_configuration", nil, configs),
		data.NewField("is_charging_station", nil, charging),
	)

	return backend.DataResponse{Frames: data.Frames{frame}}
}

func (d *Datasource) buildStationStatusFrame(rawStations []json.RawMessage) backend.DataResponse {
	stations := make([]stationStatus, 0, len(rawStations))
	for _, raw := range rawStations {
		var s stationStatus
		if err := json.Unmarshal(raw, &s); err != nil {
			continue
		}
		stations = append(stations, s)
	}

	frame := data.NewFrame("station_status")

	stationIDs := make([]string, len(stations))
	bikesAvailable := make([]int64, len(stations))
	mechanical := make([]int64, len(stations))
	ebike := make([]int64, len(stations))
	docksAvailable := make([]int64, len(stations))
	bikesDisabled := make([]int64, len(stations))
	docksDisabled := make([]int64, len(stations))
	statuses := make([]string, len(stations))
	lastReported := make([]time.Time, len(stations))

	for i, s := range stations {
		stationIDs[i] = s.StationID
		bikesAvailable[i] = s.NumBikesAvailable
		mechanical[i] = s.NumBikesAvailableTypes.Mechanical
		ebike[i] = s.NumBikesAvailableTypes.Ebike
		docksAvailable[i] = s.NumDocksAvailable
		bikesDisabled[i] = s.NumBikesDisabled
		docksDisabled[i] = s.NumDocksDisabled
		statuses[i] = s.Status
		lastReported[i] = time.Unix(s.LastReported, 0)
	}

	frame.Fields = append(frame.Fields,
		data.NewField("station_id", nil, stationIDs),
		data.NewField("num_bikes_available", nil, bikesAvailable),
		data.NewField("mechanical", nil, mechanical),
		data.NewField("ebike", nil, ebike),
		data.NewField("num_docks_available", nil, docksAvailable),
		data.NewField("num_bikes_disabled", nil, bikesDisabled),
		data.NewField("num_docks_disabled", nil, docksDisabled),
		data.NewField("status", nil, statuses),
		data.NewField("last_reported", nil, lastReported),
	)

	return backend.DataResponse{Frames: data.Frames{frame}}
}

func (d *Datasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	config, err := models.LoadPluginSettings(*req.PluginContext.DataSourceInstanceSettings)
	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "Unable to load settings",
		}, nil
	}

	if config.Secrets.ApiKey == "" {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "API key is missing",
		}, nil
	}

	_, err = d.doAPIRequest(ctx, "station_information")
	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "API request failed: " + err.Error(),
		}, nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working",
	}, nil
}
