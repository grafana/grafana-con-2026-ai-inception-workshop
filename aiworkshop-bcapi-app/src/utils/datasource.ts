import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import { StationInfo, StationStatus } from '../types';

const DS_TYPE = 'aiworkshop-bcapi-datasource';

export interface StationListItem {
  value: string;
  label: string;
}

export function getDatasourceInstances(): Array<{ uid: string; name: string }> {
  return getDataSourceSrv()
    .getList({ type: DS_TYPE })
    .map((ds) => ({ uid: ds.uid, name: ds.name }));
}

export function fetchStationList(dsUid: string): Promise<StationListItem[]> {
  return getBackendSrv().get(`/api/datasources/uid/${dsUid}/resources/stations`);
}

interface FrameResponse {
  results: Record<string, { frames: Array<{ schema: { fields: Array<{ name: string }> }; data: { values: unknown[][] } }> }>;
}

function frameToObjects<T>(response: FrameResponse, refId: string): T[] {
  const frame = response.results[refId]?.frames?.[0];
  if (!frame) {
    return [];
  }
  const fields = frame.schema.fields;
  const values = frame.data.values;
  const rowCount = values[0]?.length ?? 0;
  const result: T[] = [];
  for (let i = 0; i < rowCount; i++) {
    const obj: Record<string, unknown> = {};
    for (let f = 0; f < fields.length; f++) {
      obj[fields[f].name] = values[f][i];
    }
    result.push(obj as T);
  }
  return result;
}

function queryDatasource<T>(dsUid: string, endpoint: string, refId: string, stationId?: string): Promise<T[]> {
  return getBackendSrv()
    .post('/api/ds/query', {
      queries: [
        {
          refId,
          datasource: { uid: dsUid, type: DS_TYPE },
          endpoint,
          ...(stationId ? { stationId } : {}),
        },
      ],
      from: 'now-1h',
      to: 'now',
    })
    .then((res: FrameResponse) => frameToObjects<T>(res, refId));
}

export interface StationDetail {
  info?: StationInfo;
  status?: StationStatus;
}

const detailCache = new Map<string, StationDetail>();
let statusCache: Map<string, StationStatus> | null = null;
let statusCacheDsUid: string | null = null;

export function clearDetailCache() {
  detailCache.clear();
  statusCache = null;
  statusCacheDsUid = null;
}

async function getStatusMap(dsUid: string): Promise<Map<string, StationStatus>> {
  if (statusCache && statusCacheDsUid === dsUid) {
    return statusCache;
  }
  const statusList = await queryDatasource<StationStatus>(dsUid, 'station_status', 'status');
  const map = new Map<string, StationStatus>();
  for (const s of statusList) {
    map.set(s.station_id, s);
  }
  statusCache = map;
  statusCacheDsUid = dsUid;
  return map;
}

export async function fetchStationDetail(dsUid: string, stationId: string): Promise<StationDetail> {
  const cached = detailCache.get(stationId);
  if (cached) {
    return cached;
  }

  const [infoList, statusMap] = await Promise.all([
    queryDatasource<StationInfo>(dsUid, 'station_information', 'info', stationId),
    getStatusMap(dsUid),
  ]);

  const detail: StationDetail = {
    info: infoList[0],
    status: statusMap.get(stationId),
  };
  detailCache.set(stationId, detail);
  return detail;
}
