package plugin

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestQueryData(t *testing.T) {
	apiResp := `{"last_updated":1234,"ttl":0,"data":{"stations":[{"station_id":"1","num_bikes_available":5,"num_bikes_available_types":{"mechanical":3,"ebike":2},"num_docks_available":10,"num_bikes_disabled":0,"num_docks_disabled":0,"status":"IN_SERVICE","is_installed":1,"is_renting":1,"is_returning":1,"last_reported":1700000000}]}}`

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(apiResp))
	}))
	defer server.Close()

	ds, err := NewDatasource(context.Background(), backend.DataSourceInstanceSettings{
		JSONData:                json.RawMessage(`{"baseURL":"` + server.URL + `"}`),
		DecryptedSecureJSONData: map[string]string{"apiKey": "test-key"},
	})
	if err != nil {
		t.Fatal(err)
	}

	queryJSON, _ := json.Marshal(queryModel{Endpoint: "station_status"})
	resp, err := ds.(*Datasource).QueryData(
		context.Background(),
		&backend.QueryDataRequest{
			Queries: []backend.DataQuery{
				{RefID: "A", JSON: queryJSON},
			},
		},
	)
	if err != nil {
		t.Error(err)
	}

	if len(resp.Responses) != 1 {
		t.Fatal("QueryData must return a response")
	}

	r := resp.Responses["A"]
	if r.Error != nil {
		t.Fatalf("unexpected error: %v", r.Error)
	}
	if len(r.Frames) != 1 {
		t.Fatalf("expected 1 frame, got %d", len(r.Frames))
	}
	if r.Frames[0].Rows() != 1 {
		t.Fatalf("expected 1 row, got %d", r.Frames[0].Rows())
	}
}
