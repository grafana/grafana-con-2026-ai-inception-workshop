import { DataSourceJsonData } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export interface MyQuery extends DataQuery {
  endpoint: string;
  stationId?: string;
}

export const DEFAULT_QUERY: Partial<MyQuery> = {
  endpoint: 'station_status',
};

export interface MyDataSourceOptions extends DataSourceJsonData {
  baseURL?: string;
}

export interface MySecureJsonData {
  apiKey?: string;
}

export interface StationOption {
  value: string;
  label: string;
}
