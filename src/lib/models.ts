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

// Packet Statistics types
export interface PacketStatsWindow {
  timestamp: string;
  packets_tx: number;
  packets_rx: number;
  packets_rx_bad: number;
  packets_rx_dupe: number;
  total_packets: number;
}

export interface PacketStatsSummary {
  total_packets_tx: number;
  total_packets_rx: number;
  total_packets_rx_bad: number;
  total_packets_rx_dupe: number;
  total_packets: number;
  time_range: {
    start: string;
    end: string;
  };
}

export interface PacketStatsResponse {
  hourly_stats: PacketStatsWindow[];
  summary: PacketStatsSummary;
}

// API request types for packet stats
export interface PacketStatsParams extends DateRangeParams {
  nodeId?: number;
  channel?: number;
}
