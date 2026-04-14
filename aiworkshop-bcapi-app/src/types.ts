export interface StationInfo {
  station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  address: string;
  cross_street: string;
  post_code: string;
  capacity: number;
  physical_configuration: string;
  is_charging_station: boolean;
}

export interface StationStatus {
  station_id: string;
  num_bikes_available: number;
  mechanical: number;
  ebike: number;
  num_docks_available: number;
  num_bikes_disabled: number;
  num_docks_disabled: number;
  status: string;
  last_reported: number;
}

export interface Station {
  info: StationInfo;
  status?: StationStatus;
}

export type DsRef = string | null;
