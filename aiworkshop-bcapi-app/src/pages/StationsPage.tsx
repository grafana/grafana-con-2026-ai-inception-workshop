import React, { useState } from 'react';
import { css } from '@emotion/css';
import { DataSourceInstanceSettings, GrafanaTheme2 } from '@grafana/data';
import { DataSourcePicker, PluginPage, getDataSourceSrv } from '@grafana/runtime';
import { Alert, LoadingPlaceholder, Tooltip, useStyles2 } from '@grafana/ui';
import { useStations } from '../hooks/useStations';
import { Station } from '../types';
import { testIds } from '../components/testIds';

const DS_PLUGIN_ID = 'aiworkshop-bcapi-datasource';

function StationsPage() {
  const styles = useStyles2(getStyles);
  const [dsUid, setDsUid] = useState<string | null>(() => {
    const list = getDataSourceSrv().getList({ pluginId: DS_PLUGIN_ID });
    return list.length > 0 ? list[0].uid : null;
  });

  const { stations, loading, error } = useStations(dsUid);

  const onDsChange = (ds: DataSourceInstanceSettings) => {
    setDsUid(ds.uid);
  };

  return (
    <PluginPage>
      <div data-testid={testIds.stationsPage.container}>
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
          <div className={styles.list}>
            {stations.map((station) => (
              <StationItem key={station.info.station_id} station={station} />
            ))}
          </div>
        )}

        {!loading && !error && stations.length === 0 && dsUid && (
          <p>No stations found.</p>
        )}
      </div>
    </PluginPage>
  );
}

function StationItem({ station }: { station: Station }) {
  const styles = useStyles2(getStyles);
  const { info, status } = station;

  const tooltipContent = (
    <div className={styles.tooltip}>
      <div><strong>{info.name}</strong></div>
      <div>{info.address}</div>
      {info.post_code && <div>Post code: {info.post_code}</div>}
      <div>Capacity: {info.capacity} docks</div>
      <div>Type: {info.physical_configuration}</div>
      <div>Charging: {info.is_charging_station ? 'Yes' : 'No'}</div>
      <div>Coordinates: {info.latitude.toFixed(5)}, {info.longitude.toFixed(5)}</div>
      {info.altitude > 0 && <div>Altitude: {info.altitude}m</div>}
      {status && (
        <>
          <hr className={styles.tooltipDivider} />
          <div>Status: {status.status}</div>
          <div>Bikes: {status.num_bikes_available} ({status.mechanical} mechanical, {status.ebike} e-bike)</div>
          <div>Docks available: {status.num_docks_available}</div>
          {status.num_bikes_disabled > 0 && <div>Bikes disabled: {status.num_bikes_disabled}</div>}
          {status.num_docks_disabled > 0 && <div>Docks disabled: {status.num_docks_disabled}</div>}
          <div>Last reported: {new Date(status.last_reported * 1000).toLocaleString()}</div>
        </>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} placement="right">
      <div className={styles.item} data-testid={testIds.stationsPage.stationItem}>
        <div className={styles.itemName}>{info.name}</div>
        <div className={styles.itemMeta}>
          {info.address}
          {status && ` \u2014 Bikes: ${status.num_bikes_available} | Docks: ${status.num_docks_available}`}
        </div>
      </div>
    </Tooltip>
  );
}

export default StationsPage;

const getStyles = (theme: GrafanaTheme2) => ({
  pickerRow: css({
    marginBottom: theme.spacing(2),
    maxWidth: 400,
  }),
  list: css({
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing(0.5),
  }),
  item: css({
    padding: theme.spacing(1, 1.5),
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    cursor: 'pointer',
    '&:hover': {
      background: theme.colors.action.hover,
    },
  }),
  itemName: css({
    fontWeight: theme.typography.fontWeightMedium,
  }),
  itemMeta: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  tooltip: css({
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: 1.6,
  }),
  tooltipDivider: css({
    margin: `${theme.spacing(0.5)} 0`,
    border: 'none',
    borderTop: `1px solid ${theme.colors.border.weak}`,
  }),
});
