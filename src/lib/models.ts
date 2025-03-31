// Base interfaces for API responses
export interface NodeData {
  id: number;
  node_id: string;
  short_name: string;
  long_name: string;
  last_heard: string | null;
  hardware_model: string;
  meshtastic_version: string;
  latest_device_metrics: DeviceMetrics | null;
  last_position: Position | null;
}

export interface DeviceMetrics {
  time: string;
  battery_level: number;
  voltage: number;
  chUtil: number;
  airUtil: number;
  uptime: number;
}

export interface Position {
  time: string;
  reported_time: string;
  latitude: number;
  longitude: number;
  altitude: number;
  location_source: string;
}

// API response types
export interface NodeSearchResult {
  id: number;
  node_id: string;
  short_name: string;
  long_name: string;
}

// API request types
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}
