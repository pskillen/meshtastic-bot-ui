// Base interfaces for API responses
export interface NodeData {
  id: number;
  node_id: string;
  short_name: string;
  long_name: string;
  last_heard: Date | null;
  hardware_model: string;
  meshtastic_version: string;
  latest_device_metrics: DeviceMetrics | null;
  last_position: Position | null;
}

export interface DeviceMetrics {
  time: Date;
  battery_level: number;
  voltage: number;
  chUtil: number;
  airUtil: number;
  uptime: number;
}

export interface Position {
  time: Date;
  reported_time: Date;
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
  startDate?: Date;
  endDate?: Date;
}

// Packet Statistics types
export interface PacketStatsWindow {
  timestamp: Date;
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
    start: Date;
    end: Date;
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
