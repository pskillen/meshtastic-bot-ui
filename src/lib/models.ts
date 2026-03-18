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

/** Embedded claim info for the current user on an ObservedNode (from node detail response). Does not include claim_key (sensitive; use claims API). */
export interface ObservedNodeClaimEmbedded {
  created_at: string;
  accepted_at: string | null;
}

// ObservedNode from Meshflow API v2
export interface ObservedNode {
  internal_id: number;
  node_id: number;
  node_id_str: string;
  mac_addr: string | null;
  long_name: string | null;
  short_name: string | null;
  hw_model: string | null;
  public_key: string | null;
  role?: number | null;
  is_licensed?: boolean | null;
  is_unmessagable?: boolean | null;
  // Additional fields for UI compatibility
  last_heard?: Date | null;
  latest_device_metrics?: DeviceMetrics | null;
  latest_environment_metrics?: LatestEnvironmentMetrics | null;
  latest_power_metrics?: LatestPowerMetrics | null;
  latest_position?: Position | null;
  owner?: NodeOwnerInfo | null;
  /** Current user's claim for this node, if any. Present when authenticated. */
  claim?: ObservedNodeClaimEmbedded | null;
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
    bot_default_ignore_portnums?: string | null;
    bot_default_hop_limit?: number | null;
  };
  allow_auto_traceroute?: boolean;
  position: {
    latitude: number | null;
    longitude: number | null;
    precision_bits?: number | null;
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

/** Enriched route node with position for map display (from API route_nodes/route_back_nodes) */
export interface TracerouteRouteNode {
  node_id: number;
  node_id_str: string;
  short_name: string | null;
  position: { latitude: number; longitude: number } | null;
  snr?: number | null;
}

// Traceroute interfaces
export interface AutoTraceRoute {
  id: number;
  source_node: ManagedNode;
  target_node: ObservedNode;
  trigger_type: 'auto' | 'user';
  triggered_by: number | null;
  triggered_by_username: string | null;
  trigger_source: string | null;
  triggered_at: string;
  status: 'pending' | 'sent' | 'completed' | 'failed';
  route: Array<{ node_id: number; snr: number | null }> | null;
  route_back: Array<{ node_id: number; snr: number | null }> | null;
  route_nodes?: TracerouteRouteNode[];
  route_back_nodes?: TracerouteRouteNode[];
  raw_packet: string | null;
  completed_at: string | null;
  error_message: string | null;
}

// Message interfaces (API v2)
export interface TextMessageSender {
  node_id_str: string;
  long_name: string | null;
  short_name: string | null;
}

export interface PacketObservationObserver {
  node_id: number;
  node_id_str: string;
  long_name: string | null;
  short_name: string | null;
}

export interface PacketObservation {
  observer: PacketObservationObserver;
  rx_time: string; // ISO date string
  rx_rssi: number | null;
  rx_snr: number | null;
  direct_from_sender: boolean;
  hop_count: number | null;
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
  heard: PacketObservation[];
}

export interface TextMessageResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TextMessage[];
}

export interface DeviceMetrics {
  reported_time: Date | null;
  logged_time: Date | null;
  battery_level: number;
  voltage: number;
  channel_utilization: number; // Changed from chUtil
  air_util_tx: number; // Changed from airUtil
  uptime_seconds: number; // Changed from uptime
}

/** Latest environment metrics from node (NodeLatestStatus) */
export interface LatestEnvironmentMetrics {
  temperature?: number | null;
  relative_humidity?: number | null;
  barometric_pressure?: number | null;
  gas_resistance?: number | null;
  iaq?: number | null;
  lux?: number | null;
  wind_direction?: number | null;
  wind_speed?: number | null;
  radiation?: number | null;
  rainfall_1h?: number | null;
  rainfall_24h?: number | null;
  reported_time?: Date | string | null;
}

/** Latest power metrics from node (NodeLatestStatus) */
export interface LatestPowerMetrics {
  ch1_voltage?: number | null;
  ch1_current?: number | null;
  ch2_voltage?: number | null;
  ch2_current?: number | null;
  ch3_voltage?: number | null;
  ch3_current?: number | null;
  ch4_voltage?: number | null;
  ch4_current?: number | null;
  ch5_voltage?: number | null;
  ch5_current?: number | null;
  ch6_voltage?: number | null;
  ch6_current?: number | null;
  ch7_voltage?: number | null;
  ch7_current?: number | null;
  ch8_voltage?: number | null;
  ch8_current?: number | null;
  reported_time?: Date | string | null;
}

/** Environment metrics record (history endpoint) */
export interface EnvironmentMetrics {
  id: number;
  node: number;
  logged_time: Date | string | null;
  reported_time: Date | string | null;
  temperature?: number | null;
  relative_humidity?: number | null;
  barometric_pressure?: number | null;
  gas_resistance?: number | null;
  iaq?: number | null;
  lux?: number | null;
  wind_direction?: number | null;
  wind_speed?: number | null;
  radiation?: number | null;
  rainfall_1h?: number | null;
  rainfall_24h?: number | null;
}

/** Power metrics record (history endpoint) */
export interface PowerMetrics {
  id: number;
  node: number;
  logged_time: Date | string | null;
  reported_time: Date | string | null;
  ch1_voltage?: number | null;
  ch1_current?: number | null;
  ch2_voltage?: number | null;
  ch2_current?: number | null;
  ch3_voltage?: number | null;
  ch3_current?: number | null;
  ch4_voltage?: number | null;
  ch4_current?: number | null;
  ch5_voltage?: number | null;
  ch5_current?: number | null;
  ch6_voltage?: number | null;
  ch6_current?: number | null;
  ch7_voltage?: number | null;
  ch7_current?: number | null;
  ch8_voltage?: number | null;
  ch8_current?: number | null;
}

export interface Position {
  reported_time: Date | null;
  logged_time: Date | null;
  latitude: number;
  longitude: number;
  altitude: number | null;
  location_source: string;
  /** Meshtastic precision_bits – lower = larger uncertainty. 16≈365m, 17≈182m, 18≈91m, etc. */
  precision_bits?: number | null;
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

export interface NeighbourStatsCandidate {
  node_id: number;
  node_id_str: string;
  short_name: string | null;
}

export interface NeighbourStatsBySource {
  source: number;
  source_type: 'lsb' | 'full';
  count: number;
  candidates: NeighbourStatsCandidate[];
}

export interface NeighbourStats {
  start_date: string | null;
  end_date: string | null;
  by_source: NeighbourStatsBySource[];
  total_packets: number;
}

export interface StatsSnapshot {
  id: number;
  recorded_at: string;
  stat_type: 'online_nodes' | 'new_nodes' | 'packet_volume';
  constellation_id: number | null;
  value: { count: number; window_hours?: number };
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
  bot_default_ignore_portnums?: string | null;
  bot_default_hop_limit?: number | null;
}

export interface NodeClaim {
  node: {
    node_id: number;
    node_id_str: string;
    long_name: string;
    short_name: string;
    last_heard: string | null;
  };
  user: number;
  claim_key: string;
  created_at: string;
  accepted_at: string | null;
}

/** Constellation object returned in API key list/detail (includes bot setup defaults) */
export interface NodeApiKeyConstellation {
  id: number;
  name: string;
  map_color: string;
  bot_default_ignore_portnums?: string | null;
  bot_default_hop_limit?: number | null;
}

export interface NodeApiKey {
  id: string;
  key: string;
  name: string;
  /** Constellation ID (create response) or object (list/detail response) */
  constellation: number | NodeApiKeyConstellation;
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
