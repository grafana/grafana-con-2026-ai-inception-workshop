import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Button, Combobox, type ComboboxOption, Modal, Spinner, useStyles2 } from '@grafana/ui';
import { Map as MapGL, Source, Layer, Popup, NavigationControl, type MapRef, type MapMouseEvent, type LayerProps } from 'react-map-gl/maplibre';
import type { GeoJSON } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { llm } from '@grafana/llm';
import { StationInfo, StationStatus } from '../types';
import { getDatasourceInstances, fetchAllStationInfo, fetchAllStationStatus } from '../utils/datasource';
import { testIds } from '../components/testIds';

interface MapStation extends StationInfo {
  status?: StationStatus;
}

type MapState = {
  stations: MapStation[];
  loading: boolean;
  error: string | null;
};

type MapAction =
  | { type: 'fetch' }
  | { type: 'success'; stations: MapStation[] }
  | { type: 'error'; message: string };

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'fetch':
      return { stations: [], loading: true, error: null };
    case 'success':
      return { stations: action.stations, loading: false, error: null };
    case 'error':
      return { stations: [], loading: false, error: action.message };
  }
}

function useMapStations(dsUid: string | undefined) {
  const [state, dispatch] = useReducer(mapReducer, { stations: [], loading: false, error: null });

  useEffect(() => {
    if (!dsUid) {
      return;
    }
    let cancelled = false;
    dispatch({ type: 'fetch' });
    Promise.all([fetchAllStationInfo(dsUid), fetchAllStationStatus(dsUid)])
      .then(([infoList, statusList]) => {
        if (cancelled) {
          return;
        }
        const statusMap = new window.Map<string, StationStatus>();
        for (const s of statusList) {
          statusMap.set(s.station_id, s);
        }
        const merged = infoList.map((info) => ({ ...info, status: statusMap.get(info.station_id) }));
        dispatch({ type: 'success', stations: merged });
      })
      .catch((err) => {
        if (!cancelled) {
          dispatch({ type: 'error', message: err.message ?? 'Failed to fetch stations' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dsUid]);

  return state;
}

function toGeoJSON(stations: MapStation[]): GeoJSON {
  return {
    type: 'FeatureCollection',
    features: stations.map((s) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [s.longitude, s.latitude] },
      properties: {
        station_id: s.station_id,
        name: s.name,
        address: s.address,
        post_code: s.post_code,
        capacity: s.capacity,
        physical_configuration: s.physical_configuration,
        is_charging_station: s.is_charging_station,
        num_bikes_available: s.status?.num_bikes_available ?? 0,
        mechanical: s.status?.mechanical ?? 0,
        ebike: s.status?.ebike ?? 0,
        num_docks_available: s.status?.num_docks_available ?? 0,
        station_status: s.status?.status ?? '',
        last_reported: s.status?.last_reported ?? 0,
      },
    })),
  };
}

const CLUSTER_LAYER: LayerProps = {
  id: 'clusters',
  type: 'circle',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 20, '#f1f075', 50, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 18, 20, 24, 50, 30],
  },
};

const CLUSTER_COUNT_LAYER: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-size': 13,
  },
  paint: {
    'text-color': '#000',
  },
};

const STATION_LAYER: LayerProps = {
  id: 'unclustered-point',
  type: 'circle',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#11b4da',
    'circle-radius': 7,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff',
  },
};

const BARCELONA_CENTER = { longitude: 2.1734, latitude: 41.3851 };

function useAskAI() {
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiStationName, setAiStationName] = useState<string>('');

  const askAI = useCallback(async (properties: Record<string, unknown>) => {
    const stationName = String(properties.name ?? 'Unknown');
    setAiStationName(stationName);
    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);
    try {
      const isEnabled = await llm.enabled();
      if (!isEnabled) {
        setAiError('Grafana LLM plugin is not enabled. Please install and configure the grafana-llm-app plugin.');
        return;
      }

      const response = await llm.chatCompletions({
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that provides concise information about Bicing bike-sharing stations in Barcelona. ' +
              'Keep your answers short and practical (3-5 sentences max).',
          },
          {
            role: 'user',
            content:
              `Tell me about this Bicing station and the requirements to use it:\n` +
              `- Name: ${stationName}\n` +
              `- Address: ${String(properties.address ?? 'Unknown')}\n` +
              `- Capacity: ${String(properties.capacity ?? 'Unknown')} docks\n` +
              `- Type: ${String(properties.physical_configuration ?? 'Unknown')}\n` +
              `- Available bikes: ${String(properties.num_bikes_available ?? 0)} (${String(properties.mechanical ?? 0)} mechanical, ${String(properties.ebike ?? 0)} e-bike)\n` +
              `- Available docks: ${String(properties.num_docks_available ?? 0)}\n` +
              `- Charging station: ${properties.is_charging_station ? 'Yes' : 'No'}`,
          },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      if (content) {
        setAiResponse(content);
      } else {
        setAiError('No response from LLM.');
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to get AI response.');
    } finally {
      setAiLoading(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    setAiResponse(null);
    setAiError(null);
    setAiLoading(false);
    setAiStationName('');
  }, []);

  const isOpen = aiLoading || aiResponse !== null || aiError !== null;

  return { aiResponse, aiLoading, aiError, aiStationName, isOpen, askAI, dismiss };
}

function MapPage() {
  const s = useStyles2(getStyles);
  const mapRef = useRef<MapRef>(null);

  const dsOptions = useMemo(() => {
    return getDatasourceInstances().map((ds) => ({ label: ds.name, value: ds.uid }));
  }, []);

  const [selectedDs, setSelectedDs] = useState<string | null>(dsOptions[0]?.value ?? null);
  const { stations, loading, error } = useMapStations(selectedDs ?? undefined);

  const geojson = useMemo(() => toGeoJSON(stations), [stations]);

  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    properties: Record<string, unknown>;
  } | null>(null);

  const ai = useAskAI();

  const handleDsChange = useCallback((option: ComboboxOption<string>) => {
    setSelectedDs(option.value);
    setPopupInfo(null);
  }, []);

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!map) {
        return;
      }

      const clusterFeatures = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      if (clusterFeatures.length > 0) {
        const feature = clusterFeatures[0];
        const clusterId = feature.properties?.cluster_id;
        const source = map.getSource('stations') as unknown as { getClusterExpansionZoom: (id: number, cb: (err: unknown, zoom: number) => void) => void };
        source.getClusterExpansionZoom(clusterId, (err: unknown, zoom: number) => {
          if (err || !feature.geometry || feature.geometry.type !== 'Point') {
            return;
          }
          map.easeTo({
            center: feature.geometry.coordinates as [number, number],
            zoom,
          });
        });
        return;
      }

      const pointFeatures = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
      if (pointFeatures.length > 0) {
        const feature = pointFeatures[0];
        if (feature.geometry.type === 'Point') {
          setPopupInfo({
            longitude: feature.geometry.coordinates[0],
            latitude: feature.geometry.coordinates[1],
            properties: feature.properties ?? {},
          });
        }
      }
    },
    []
  );

  const handleMouseEnter = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.getCanvas().style.cursor = 'pointer';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.getCanvas().style.cursor = '';
    }
  }, []);

  return (
    <PluginPage>
      <div data-testid={testIds.map.container}>
        <div className={s.dsSelector}>
          <Combobox
            data-testid={testIds.map.datasourceSelect}
            options={dsOptions}
            value={selectedDs}
            onChange={handleDsChange}
            placeholder="Select a datasource"
            width={40}
          />
        </div>

        {error && <Alert severity="error" title="Error loading stations">{error}</Alert>}

        {loading && (
          <div className={s.centered}>
            <Spinner size="xl" />
          </div>
        )}

        {!loading && !error && !selectedDs && (
          <Alert severity="warning" title="No datasource">
            No aiworkshop-bcapi-datasource instance found. Please configure one first.
          </Alert>
        )}

        {!loading && !error && selectedDs && (
          <div className={s.mapContainer}>
            <MapGL
              ref={mapRef}
              initialViewState={{ ...BARCELONA_CENTER, zoom: 13 }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="https://tiles.openfreemap.org/styles/liberty"
              onClick={handleClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              interactiveLayerIds={['clusters', 'unclustered-point']}
            >
              <NavigationControl position="top-right" />
              <Source id="stations" type="geojson" data={geojson} cluster clusterMaxZoom={14} clusterRadius={50}>
                <Layer {...CLUSTER_LAYER} />
                <Layer {...CLUSTER_COUNT_LAYER} />
                <Layer {...STATION_LAYER} />
              </Source>
              {popupInfo && (
                <Popup
                  longitude={popupInfo.longitude}
                  latitude={popupInfo.latitude}
                  anchor="top"
                  onClose={() => setPopupInfo(null)}
                  maxWidth="320px"
                >
                  <StationPopup properties={popupInfo.properties} onAskAI={ai.askAI} />
                </Popup>
              )}
            </MapGL>
          </div>
        )}

        {ai.isOpen && (
          <Modal title={`AI Info — ${ai.aiStationName}`} isOpen onDismiss={ai.dismiss}>
            {ai.aiLoading && (
              <div className={s.modalLoading}>
                <Spinner /> Asking AI...
              </div>
            )}
            {ai.aiError && <Alert severity="error" title="AI Error">{ai.aiError}</Alert>}
            {ai.aiResponse && <p style={{ whiteSpace: 'pre-wrap' }}>{ai.aiResponse}</p>}
          </Modal>
        )}
      </div>
    </PluginPage>
  );
}

function StationPopup({ properties, onAskAI }: { properties: Record<string, unknown>; onAskAI: (properties: Record<string, unknown>) => void }) {
  const s = useStyles2(getPopupStyles);
  const p = properties;
  const lastReported = Number(p.last_reported) || 0;

  return (
    <div className={s.popup}>
      <div className={s.title}>{String(p.name ?? '')}</div>
      <div className={s.section}>
        <div>{String(p.address ?? '')}</div>
        {Boolean(p.post_code) && <div>Post code: {String(p.post_code)}</div>}
        <div>Capacity: {String(p.capacity ?? '')} docks</div>
        <div>Type: {String(p.physical_configuration ?? '')}</div>
        {Boolean(p.is_charging_station) && <div>Charging station</div>}
      </div>
      {Boolean(p.station_status) && (
        <div className={s.section}>
          <div className={s.subtitle}>Real-time status</div>
          <div>
            Bikes: {String(p.num_bikes_available)} ({String(p.mechanical)} mechanical, {String(p.ebike)} e-bike)
          </div>
          <div>Docks available: {String(p.num_docks_available)}</div>
          <div>Status: {String(p.station_status)}</div>
          {lastReported > 0 && (
            <div>Last reported: {new Date(lastReported).toLocaleString()}</div>
          )}
        </div>
      )}
      <div className={s.section}>
        <Button size="sm" variant="primary" onClick={() => onAskAI(p)}>
          Ask AI about this station
        </Button>
      </div>
    </div>
  );
}

export default MapPage;

const getStyles = (theme: GrafanaTheme2) => ({
  dsSelector: css({
    marginBottom: theme.spacing(2),
  }),
  centered: css({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  }),
  mapContainer: css({
    height: 'calc(100vh - 200px)',
    minHeight: '500px',
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
  }),
  modalLoading: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
  }),
});

const getPopupStyles = (theme: GrafanaTheme2) => ({
  popup: css({
    padding: theme.spacing(0.5),
    color: '#1e1e1e',
  }),
  title: css({
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.h5.fontSize,
    marginBottom: theme.spacing(0.5),
  }),
  subtitle: css({
    fontWeight: theme.typography.fontWeightBold,
    marginBottom: theme.spacing(0.25),
  }),
  section: css({
    marginBottom: theme.spacing(0.5),
    '& > div': {
      lineHeight: 1.5,
      fontSize: theme.typography.bodySmall.fontSize,
    },
  }),
});
