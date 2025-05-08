export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface NodeOwnerInfo {
  id: number;
  username: string;
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
  owner?: NodeOwnerInfo | null;
}

// ManagedNode from Meshflow API v2
export interface ManagedNode {
  node_id: number;
  long_name: string | null;
  short_name: string | null;
  last_heard: Date | null;
  node_id_str: string;
  owner: {
    id: number;
    username: string;
  };
  constellation: {
    id: number;
    name?: string;
    map_color?: string;
  };
  position: {
    latitude: number | null;
    longitude: number | null;
  };
}

// OwnedManagedNode extends ManagedNode with channel mappings
export interface OwnedManagedNode extends ManagedNode {
  channel_0?: { id: number } | null;
  channel_1?: { id: number } | null;
  channel_2?: { id: number } | null;
  channel_3?: { id: number } | null;
  channel_4?: { id: number } | null;
  channel_5?: { id: number } | null;
  channel_6?: { id: number } | null;
  channel_7?: { id: number } | null;
  default_location_latitude?: number | null;
  default_location_longitude?: number | null;
}

export interface CreateManagedNode {
  node_id: number;
  constellation_id: number;
  name: string;
  owner_id: number | null;
  default_location_latitude: number | null;
  default_location_longitude: number | null;
  channel_0: number | null;
  channel_1: number | null;
  channel_2: number | null;
  channel_3: number | null;
  channel_4: number | null;
  channel_5: number | null;
  channel_6: number | null;
  channel_7: number | null;
}

// Message interfaces (API v2)
export interface TextMessageSender {
  node_id_str: string;
  long_name: string | null;
  short_name: string | null;
}

export interface TextMessage {
  id: string; // UUID
  packet_id: number;
  sender: TextMessageSender;
  recipient_node_id: number | null;
  channel: number;
  sent_at: string; // ISO date string
  message_text: string;
  is_emoji: boolean;
  reply_to_message_id: number | null;
}

export interface TextMessageResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TextMessage[];
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
  owner?: NodeOwnerInfo | null;
}

// Global Stats types from Meshflow API v2
export interface GlobalStatsInterval {
  start_date: string;
  end_date: string;
  packets: number;
}

export interface PacketStatsInterval {
  start_date: string;
  end_date: string;
  packet_types: Array<{
    packet_type: string;
    count: number;
  }>;
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

export interface PacketStats {
  start_date: string;
  end_date: string;
  intervals: PacketStatsInterval[];
}

export interface MessageChannel {
  id: number;
  name: string;
  constellation: number;
}

export interface Constellation {
  id: number;
  name: string;
  description: string;
  created_by: number;
  channels: MessageChannel[];
  map_color: string;
}

export interface NodeClaim {
  node: string;
  user: number;
  claim_key: string;
  created_at: string;
  accepted_at: string | null;
}

export interface NodeApiKey {
  id: string;
  key: string;
  name: string;
  constellation: number;
  created_at: string;
  owner: number;
  last_used: string | null;
  is_active: boolean;
  nodes: number[];
}

export interface CreateNodeApiKey {
  name: string;
  constellation: number;
}
