import { useState, useEffect } from 'react';
import { from, lastValueFrom } from 'rxjs';
import { getDataSourceSrv } from '@grafana/runtime';
import { CoreApp, DataFrame, DataQueryResponse, dateTime } from '@grafana/data';
import { Station, StationInfo, StationStatus, DsRef } from '../types';

function parseDataFrame<T>(frame: DataFrame): T[] {
  if (!frame || !frame.fields.length) {
    return [];
  }
  const result: T[] = [];
  for (let i = 0; i < frame.length; i++) {
    const row: Record<string, unknown> = {};
    for (const field of frame.fields) {
      row[field.name] = field.values[i];
    }
    result.push(row as T);
  }
  return result;
}

async function queryEndpoint(ds: { query: Function }, refId: string, endpoint: string): Promise<DataQueryResponse> {
  const now = dateTime();
  const request = {
    requestId: `stations-${endpoint}`,
    interval: '1s',
    intervalMs: 1000,
    range: { from: now, to: now, raw: { from: 'now', to: 'now' } },
    scopedVars: {},
    timezone: 'browser',
    app: CoreApp.Unknown,
    startTime: Date.now(),
    targets: [{ refId, endpoint }],
  };

  const result = ds.query(request);
  // ds.query() may return Observable or Promise depending on the implementation
  if (result instanceof Promise) {
    return result as Promise<DataQueryResponse>;
  }
  return lastValueFrom(from(result as Iterable<DataQueryResponse>));
}

export function useStations(dsRef: DsRef) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dsRef) {
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const ds = await getDataSourceSrv().get(dsRef);

        const [infoResponse, statusResponse] = await Promise.all([
          queryEndpoint(ds, 'A', 'station_information'),
          queryEndpoint(ds, 'B', 'station_status'),
        ]);

        const infoList = parseDataFrame<StationInfo>(infoResponse.data[0]);
        const statusList = parseDataFrame<StationStatus>(statusResponse.data[0]);
        const statusMap = new Map(statusList.map((s) => [s.station_id, s]));

        const merged = infoList.map((info) => ({
          info,
          status: statusMap.get(info.station_id),
        }));

        if (!cancelled) {
          setStations(merged);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch stations');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [dsRef]);

  return { stations, loading, error };
}
