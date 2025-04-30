export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ObservedNode from Meshflow API v2
export interface ObservedNode {
  internal_id: number;
  node_id: number;
  node_id_str: string;
  mac_addr: string;
  long_name: string | null;
  short_name: string | null;
  hw_model: string | null;
  sw_version: string | null;
  public_key: string | null;
  // Additional fields for UI compatibility
  last_heard?: Date | null;
  latest_device_metrics?: DeviceMetrics | null;
  latest_position?: Position | null;
}

// ManagedNode from Meshflow API v2
export interface ManagedNode {
  internal_id: string;
  node_id: number;
  owner: number;
  constellation: number;
  name: string;
  node_id_str: string;
}

// For backward compatibility
export interface NodeData extends ObservedNode {
  id: number; // Maps to internal_id
  hardware_model: string | null; // Maps to hw_model
  meshtastic_version: string | null; // Maps to sw_version
}

// Message interfaces
export interface MessageNode {
  id: number;
  node_id: string;
  short_name: string;
}

export interface MessageReply {
  id: string;
  packet_id: number;
  message_text: string;
  rx_time: string;
  from_node: MessageNode;
  emoji?: string;
}

export interface Message {
  id: string;
  packet_id: number;
  message_text: string;
  channel: number;
  rx_time: string;
  from_node: MessageNode;
  replies: MessageReply[];
  emojis: Array<{ emoji: string; count: number }>;
}

export interface MessageResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Message[];
}

export interface DeviceMetrics {
  reported_time: Date;
  logged_time: Date;
  battery_level: number;
  voltage: number;
  channel_utilization: number; // Changed from chUtil
  air_util_tx: number; // Changed from airUtil
  uptime_seconds: number; // Changed from uptime
}

export interface Position {
  reported_time: Date;
  logged_time: Date;
  latitude: number;
  longitude: number;
  altitude: number;
  location_source: string;
}

// API response types
export interface NodeSearchResult {
  internal_id: number;
  node_id: number;
  node_id_str: string;
  short_name: string | null;
  long_name: string | null;
}

// Global Stats types from Meshflow API v2
export interface GlobalStatsInterval {
  start_date: string;
  end_date: string;
  packets: number;
}

export interface GlobalStats {
  start_date: string;
  end_date: string;
  intervals: GlobalStatsInterval[];
  summary: {
    total_packets: number;
    time_range: {
      start: string;
      end: string;
    };
  };
}
