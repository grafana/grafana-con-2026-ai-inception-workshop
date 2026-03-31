import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Card, Combobox, type ComboboxOption, Spinner, Tooltip, useStyles2 } from '@grafana/ui';
import {
  type StationDetail,
  type StationListItem,
  getDatasourceInstances,
  fetchStationList,
  fetchStationDetail,
  clearDetailCache,
} from '../utils/datasource';
import { testIds } from '../components/testIds';

type ListState = {
  items: StationListItem[];
  loading: boolean;
  error: string | null;
};

type ListAction =
  | { type: 'fetch' }
  | { type: 'success'; items: StationListItem[] }
  | { type: 'error'; message: string };

function listReducer(state: ListState, action: ListAction): ListState {
  switch (action.type) {
    case 'fetch':
      return { items: [], loading: true, error: null };
    case 'success':
      return { items: action.items, loading: false, error: null };
    case 'error':
      return { items: [], loading: false, error: action.message };
  }
}

function useStationList(dsUid: string | undefined) {
  const [state, dispatch] = useReducer(listReducer, { items: [], loading: false, error: null });

  useEffect(() => {
    if (!dsUid) {
      return;
    }
    let cancelled = false;
    clearDetailCache();
    dispatch({ type: 'fetch' });
    fetchStationList(dsUid)
      .then((data) => {
        if (!cancelled) {
          dispatch({ type: 'success', items: data });
        }
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

function StationsPage() {
  const s = useStyles2(getStyles);

  const dsOptions = useMemo(() => {
    return getDatasourceInstances().map((ds) => ({ label: ds.name, value: ds.uid }));
  }, []);

  const [selectedDs, setSelectedDs] = useState<string | null>(dsOptions[0]?.value ?? null);
  const { items, loading, error } = useStationList(selectedDs ?? undefined);

  const handleDsChange = useCallback((option: ComboboxOption<string>) => {
    setSelectedDs(option.value);
  }, []);

  return (
    <PluginPage>
      <div data-testid={testIds.stations.container}>
        <div className={s.dsSelector}>
          <Combobox
            data-testid={testIds.stations.datasourceSelect}
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

        {!loading && !error && items.length === 0 && selectedDs && (
          <Alert severity="info" title="No stations found">No station data returned from the datasource.</Alert>
        )}

        {!loading && !error && !selectedDs && (
          <Alert severity="warning" title="No datasource">
            No aiworkshop-bcapi-datasource instance found. Please configure one first.
          </Alert>
        )}

        {!loading && items.length > 0 && selectedDs && (
          <div data-testid={testIds.stations.stationList} className={s.stationList}>
            {items.map((item) => (
              <StationCard key={item.value} item={item} dsUid={selectedDs} />
            ))}
          </div>
        )}
      </div>
    </PluginPage>
  );
}

function StationCard({ item, dsUid }: { item: StationListItem; dsUid: string }) {
  const s = useStyles2(getStyles);
  const [detail, setDetail] = useState<StationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (detail || detailLoading) {
      return;
    }
    setDetailLoading(true);
    fetchStationDetail(dsUid, item.value)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [detail, detailLoading, dsUid, item.value]);

  return (
    <Tooltip
      content={<StationTooltip detail={detail} loading={detailLoading} name={item.label} />}
      placement="right"
      interactive
    >
      <div onMouseEnter={handleMouseEnter}>
        <Card data-testid={testIds.stations.stationItem} className={s.stationCard}>
          <Card.Heading>{item.label}</Card.Heading>
        </Card>
      </div>
    </Tooltip>
  );
}

function StationTooltip({ detail, loading, name }: { detail: StationDetail | null; loading: boolean; name: string }) {
  const s = useStyles2(getTooltipStyles);

  if (loading) {
    return (
      <div className={s.tooltip}>
        <Spinner size="sm" /> Loading...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className={s.tooltip}>
        <div className={s.title}>{name}</div>
        <div>Hover to load details</div>
      </div>
    );
  }

  const { info, status } = detail;

  return (
    <div className={s.tooltip}>
      <div className={s.title}>{info?.name ?? name}</div>
      {info && (
        <div className={s.section}>
          <div>{info.address}</div>
          {info.post_code && <div>Post code: {info.post_code}</div>}
          <div>Capacity: {info.capacity} docks</div>
          <div>Type: {info.physical_configuration}</div>
          {info.is_charging_station && <div>Charging station</div>}
          <div>
            Location: {info.latitude.toFixed(4)}, {info.longitude.toFixed(4)}
          </div>
        </div>
      )}
      {status && (
        <div className={s.section}>
          <div className={s.subtitle}>Real-time status</div>
          <div>
            Bikes available: {status.num_bikes_available} ({status.mechanical} mechanical, {status.ebike} e-bike)
          </div>
          <div>Docks available: {status.num_docks_available}</div>
          <div>Bikes disabled: {status.num_bikes_disabled}</div>
          <div>Docks disabled: {status.num_docks_disabled}</div>
          <div>Status: {status.status}</div>
          {status.last_reported > 0 && (
            <div>Last reported: {new Date(status.last_reported).toLocaleString()}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default StationsPage;

const getStyles = (theme: GrafanaTheme2) => ({
  dsSelector: css({
    marginBottom: theme.spacing(2),
  }),
  centered: css({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  }),
  stationList: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: theme.spacing(1),
  }),
  stationCard: css({
    cursor: 'pointer',
  }),
});

const getTooltipStyles = (theme: GrafanaTheme2) => ({
  tooltip: css({
    padding: theme.spacing(1),
    maxWidth: '350px',
  }),
  title: css({
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.h5.fontSize,
    marginBottom: theme.spacing(1),
  }),
  subtitle: css({
    fontWeight: theme.typography.fontWeightBold,
    marginBottom: theme.spacing(0.5),
  }),
  section: css({
    marginBottom: theme.spacing(1),
    '& > div': {
      lineHeight: 1.6,
    },
  }),
});
