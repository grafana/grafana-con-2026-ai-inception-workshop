import React, { useState, useMemo, useCallback, useRef } from 'react';
import { css } from '@emotion/css';
import { DataSourceInstanceSettings, GrafanaTheme2 } from '@grafana/data';
import { DataSourcePicker, PluginPage, getDataSourceSrv } from '@grafana/runtime';
import { Alert, Button, Drawer, LoadingPlaceholder, useStyles2, useTheme2 } from '@grafana/ui';
import MapGL, { Source, Layer, Popup, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre';
import type { GeoJSONSource } from 'maplibre-gl';
import type { Point } from 'geojson';
import { llm } from '@grafana/llm';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStations } from '../hooks/useStations';
import { Station } from '../types';
import { testIds } from '../components/testIds';

const DS_PLUGIN_ID = 'aiworkshop-bcapi-datasource';
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const SOURCE_ID = 'stations';

const INITIAL_VIEW = {
  longitude: 2.1734,
  latitude: 41.3851,
  zoom: 13,
};

async function askAboutStation(station: Station): Promise<string> {
  const isEnabled = await llm.enabled();
  if (!isEnabled) {
    throw new Error('Grafana LLM plugin is not enabled or configured.');
  }

  const { info, status } = station;
  const prompt = [
    `Tell me about this Barcelona Bicing station and what are the requirements to use it.`,
    `Station: ${info.name}`,
    `Address: ${info.address}`,
    `Capacity: ${info.capacity} docks`,
    `Type: ${info.physical_configuration}`,
    `Charging station: ${info.is_charging_station ? 'Yes' : 'No'}`,
    status ? `Status: ${status.status}` : '',
    status ? `Bikes available: ${status.num_bikes_available} (${status.mechanical} mechanical, ${status.ebike} e-bike)` : '',
    status ? `Docks available: ${status.num_docks_available}` : '',
  ].filter(Boolean).join('\n');

  const response = await llm.chatCompletions({
    model: llm.Model.BASE,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant knowledgeable about Barcelona\'s Bicing bicycle-sharing system. Keep answers concise (3-4 paragraphs max).',
      },
      { role: 'user', content: prompt },
    ],
  });

  if (llm.isErrorResponse(response)) {
    throw new Error(response.error);
  }

  return response.choices[0]?.message?.content ?? 'No response.';
}

function MapPage() {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const mapRef = useRef<MapRef>(null);
  const [dsUid, setDsUid] = useState<string | null>(() => {
    const list = getDataSourceSrv().getList({ pluginId: DS_PLUGIN_ID });
    return list.length > 0 ? list[0].uid : null;
  });
  const [popupStation, setPopupStation] = useState<Station | null>(null);
  const [drawerStation, setDrawerStation] = useState<Station | null>(null);
  const [llmReply, setLlmReply] = useState<string | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);

  const { stations, loading, error } = useStations(dsUid);

  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: stations.map((s) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [s.info.longitude, s.info.latitude],
      },
      properties: {
        station_id: s.info.station_id,
      },
    })),
  }), [stations]);

  const stationMap = useMemo(
    () => new globalThis.Map(stations.map((s): [string, Station] => [s.info.station_id, s])),
    [stations]
  );

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) {
      return;
    }

    if (feature.properties?.cluster) {
      const map = mapRef.current?.getMap();
      if (!map) {
        return;
      }
      const source = map.getSource(SOURCE_ID) as GeoJSONSource;
      source.getClusterExpansionZoom(feature.properties.cluster_id).then((zoom: number) => {
        const geom = feature.geometry as Point;
        map.easeTo({ center: [geom.coordinates[0], geom.coordinates[1]], zoom });
      });
      return;
    }

    const id = feature.properties?.station_id;
    const station = stationMap.get(id);
    if (station) {
      setPopupStation(station);
    }
  }, [stationMap]);

  const onAskAI = useCallback((station: Station) => {
    setPopupStation(null);
    setDrawerStation(station);
    setLlmReply(null);
    setLlmError(null);
    setLlmLoading(true);

    askAboutStation(station)
      .then((reply) => setLlmReply(reply))
      .catch((err) => setLlmError(err instanceof Error ? err.message : 'LLM request failed'))
      .finally(() => setLlmLoading(false));
  }, []);

  const onCloseDrawer = useCallback(() => {
    setDrawerStation(null);
    setLlmReply(null);
    setLlmError(null);
    setLlmLoading(false);
  }, []);

  const onDsChange = (ds: DataSourceInstanceSettings) => {
    setDsUid(ds.uid);
    setPopupStation(null);
    onCloseDrawer();
  };

  const primaryColor = theme.colors.primary.main;

  return (
    <PluginPage>
      <div data-testid={testIds.mapPage.container} className={styles.wrapper}>
        <div className={styles.pickerRow}>
          <DataSourcePicker
            pluginId={DS_PLUGIN_ID}
            current={dsUid}
            onChange={onDsChange}
          />
        </div>

        {loading && <LoadingPlaceholder text="Loading stations..." />}
        {error && <Alert title="Error loading stations" severity="error">{error}</Alert>}

        {!loading && !error && stations.length > 0 && (
          <div className={styles.mapContainer}>
            <MapGL
              ref={mapRef}
              initialViewState={INITIAL_VIEW}
              style={{ width: '100%', height: '100%' }}
              mapStyle={OPENFREEMAP_STYLE}
              interactiveLayerIds={['clusters', 'unclustered-point']}
              onClick={onClick}
              cursor="pointer"
            >
              <Source
                id={SOURCE_ID}
                type="geojson"
                data={geojson}
                cluster
                clusterMaxZoom={14}
                clusterRadius={50}
              >
                <Layer
                  id="clusters"
                  type="circle"
                  filter={['has', 'point_count']}
                  paint={{
                    'circle-color': primaryColor,
                    'circle-radius': ['step', ['get', 'point_count'], 18, 20, 24, 50, 30],
                    'circle-opacity': 0.85,
                  }}
                />
                <Layer
                  id="cluster-count"
                  type="symbol"
                  filter={['has', 'point_count']}
                  layout={{
                    'text-field': '{point_count_abbreviated}',
                    'text-size': 13,
                  }}
                  paint={{
                    'text-color': '#ffffff',
                  }}
                />
                <Layer
                  id="unclustered-point"
                  type="circle"
                  filter={['!', ['has', 'point_count']]}
                  paint={{
                    'circle-color': primaryColor,
                    'circle-radius': 6,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                  }}
                />
              </Source>

              {popupStation && (
                <Popup
                  longitude={popupStation.info.longitude}
                  latitude={popupStation.info.latitude}
                  anchor="bottom"
                  onClose={() => setPopupStation(null)}
                  offset={10}
                  maxWidth="320px"
                >
                  <StationPopup station={popupStation} onAskAI={onAskAI} />
                </Popup>
              )}
            </MapGL>
          </div>
        )}

        {drawerStation && (
          <Drawer
            title={drawerStation.info.name}
            subtitle={drawerStation.info.address}
            onClose={onCloseDrawer}
            size="sm"
          >
            <StationDrawerContent
              station={drawerStation}
              reply={llmReply}
              loading={llmLoading}
              error={llmError}
            />
          </Drawer>
        )}
      </div>
    </PluginPage>
  );
}

function StationPopup({ station, onAskAI }: { station: Station; onAskAI: (s: Station) => void }) {
  const styles = useStyles2(getStyles);
  const { info, status } = station;

  return (
    <div className={styles.popup}>
      <strong>{info.name}</strong>
      <div>{info.address}</div>
      <div>Capacity: {info.capacity} docks</div>
      {status && (
        <div>Bikes: {status.num_bikes_available} | Docks: {status.num_docks_available}</div>
      )}
      <div className={styles.popupActions}>
        <Button size="sm" icon="ai" onClick={() => onAskAI(station)}>
          Ask AI about this station
        </Button>
      </div>
    </div>
  );
}

interface StationDrawerContentProps {
  station: Station;
  reply: string | null;
  loading: boolean;
  error: string | null;
}

function StationDrawerContent({ station, reply, loading, error: llmError }: StationDrawerContentProps) {
  const styles = useStyles2(getStyles);
  const { info, status } = station;

  return (
    <div className={styles.drawerContent}>
      <div className={styles.drawerSection}>
        <h4 className={styles.drawerSectionTitle}>Station details</h4>
        {info.post_code && <div>Post code: {info.post_code}</div>}
        <div>Capacity: {info.capacity} docks</div>
        <div>Type: {info.physical_configuration}</div>
        <div>Charging: {info.is_charging_station ? 'Yes' : 'No'}</div>
        <div>Coordinates: {info.latitude.toFixed(5)}, {info.longitude.toFixed(5)}</div>
        {info.altitude > 0 && <div>Altitude: {info.altitude}m</div>}
      </div>

      {status && (
        <div className={styles.drawerSection}>
          <h4 className={styles.drawerSectionTitle}>Live status</h4>
          <div>Status: {status.status}</div>
          <div>Bikes available: {status.num_bikes_available} ({status.mechanical} mechanical, {status.ebike} e-bike)</div>
          <div>Docks available: {status.num_docks_available}</div>
          {status.num_bikes_disabled > 0 && <div>Bikes disabled: {status.num_bikes_disabled}</div>}
          {status.num_docks_disabled > 0 && <div>Docks disabled: {status.num_docks_disabled}</div>}
          <div>Last reported: {new Date(status.last_reported * 1000).toLocaleString()}</div>
        </div>
      )}

      <div className={styles.drawerSection}>
        <h4 className={styles.drawerSectionTitle}>AI assistant</h4>
        {loading && <LoadingPlaceholder text="Thinking..." />}
        {llmError && <Alert title="AI error" severity="error">{llmError}</Alert>}
        {reply && <div className={styles.llmReply}>{reply}</div>}
      </div>
    </div>
  );
}

export default MapPage;

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  }),
  pickerRow: css({
    marginBottom: theme.spacing(2),
    maxWidth: 400,
  }),
  mapContainer: css({
    flex: 1,
    minHeight: 500,
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
  }),
  popup: css({
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: 1.6,
    color: theme.colors.text.primary,
  }),
  popupActions: css({
    marginTop: theme.spacing(1),
  }),
  drawerContent: css({
    fontSize: theme.typography.body.fontSize,
    lineHeight: 1.6,
    color: theme.colors.text.primary,
  }),
  drawerSection: css({
    marginBottom: theme.spacing(2),
  }),
  drawerSectionTitle: css({
    margin: `0 0 ${theme.spacing(1)} 0`,
    color: theme.colors.text.primary,
  }),
  llmReply: css({
    whiteSpace: 'pre-wrap',
    lineHeight: 1.6,
    color: theme.colors.text.primary,
  }),
});
