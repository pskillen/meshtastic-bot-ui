import { BaseApi } from './base';
import {
  ObservedNode,
  ManagedNode,
  OwnedManagedNode,
  DeviceMetrics,
  Position,
  NodeSearchResult,
  PaginatedResponse,
  GlobalStats,
  NeighbourStats,
  StatsSnapshot,
  Constellation,
  MessageChannel,
  TextMessage,
  TextMessageResponse,
  NodeClaim,
  CreateManagedNode,
  NodeApiKey,
  CreateNodeApiKey,
  AutoTraceRoute,
} from '../models';
import {
  ApiConfig,
  DateRangeParams,
  DateRangeIntervalParams,
  PaginationParams,
  StatsSnapshotsParams,
} from '@/lib/types';
import { parseObservedNodeFromAPI } from './api-utils';

export class MeshtasticApi extends BaseApi {
  constructor(config: ApiConfig) {
    super(config);
  }

  // ===== Observed Nodes API =====

  /**
   * Get a paginated list of observed nodes
   */
  async getNodes(params?: PaginationParams): Promise<PaginatedResponse<ObservedNode>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.last_heard_after) {
      searchParams.append('last_heard_after', params.last_heard_after.toISOString());
    }

    const response = await this.get<PaginatedResponse<ObservedNode>>('/nodes/observed-nodes/', searchParams);
    return {
      ...response,
      results: response.results.map((node) => parseObservedNodeFromAPI(node)),
    };
  }

  /**
   * Get a paginated list of observed nodes owned by the current user
   */
  async getMyClaimedNodes(params?: PaginationParams): Promise<PaginatedResponse<ObservedNode>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    const response = await this.get<PaginatedResponse<ObservedNode>>('/nodes/observed-nodes/mine/', searchParams);
    return {
      ...response,
      results: response.results.map((node) => parseObservedNodeFromAPI(node)),
    };
  }

  /**
   * Get a single observed node by ID
   */
  async getNode(id: number): Promise<ObservedNode> {
    const node = await this.get<ObservedNode>(`/nodes/observed-nodes/${id}/`);
    return parseObservedNodeFromAPI(node);
  }

  /**
   * Get node counts by time window (nodes seen since each threshold).
   * Returns: { "2": n, "24": n, "168": n, "720": n, "2160": n, "all": n }
   */
  async getRecentNodeCounts(): Promise<Record<string, number>> {
    return this.get<Record<string, number>>('/nodes/observed-nodes/recent_counts/');
  }

  /**
   * Get infrastructure nodes (router, repeater, router_late, ROUTER_CLIENT).
   * Optionally include CLIENT_BASE via includeClientBase.
   */
  async getInfrastructureNodes(params?: {
    lastHeardAfter?: Date;
    page?: number;
    pageSize?: number;
    includeClientBase?: boolean;
  }): Promise<PaginatedResponse<ObservedNode>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('page_size', params.pageSize.toString());
    if (params?.lastHeardAfter) {
      searchParams.append('last_heard_after', params.lastHeardAfter.toISOString());
    }
    if (params?.includeClientBase) {
      searchParams.append('include_client_base', 'true');
    }

    const response = await this.get<PaginatedResponse<ObservedNode>>(
      '/nodes/observed-nodes/infrastructure/',
      searchParams
    );
    return {
      ...response,
      results: response.results.map((node) => parseObservedNodeFromAPI(node)),
    };
  }

  /**
   * Search for observed nodes
   */
  async searchNodes(query: string): Promise<NodeSearchResult[]> {
    if (!query.trim()) return [];
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    return this.get<NodeSearchResult[]>('/nodes/observed-nodes/search/', searchParams);
  }

  /**
   * Get device metrics for multiple nodes in one request (bulk).
   * Returns flat list; frontend groups by node_id for per-node charts.
   */
  async getDeviceMetricsBulk(
    nodeIds: number[],
    params?: DateRangeParams
  ): Promise<Array<DeviceMetrics & { node_id: number; node_id_str: string; short_name: string | null }>> {
    if (nodeIds.length === 0) return [];
    const searchParams = new URLSearchParams();
    searchParams.append('node_ids', nodeIds.join(','));
    if (params?.startDate) searchParams.append('start_date', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('end_date', params.endDate.toISOString());

    const response = await this.get<{
      results: Array<DeviceMetrics & { node_id: number; node_id_str: string; short_name: string | null }>;
    }>('/nodes/device-metrics-bulk/', searchParams);
    return (response.results || []).map((metric) => ({
      ...metric,
      logged_time: metric.logged_time != null ? new Date(metric.logged_time) : null,
      reported_time: metric.reported_time != null ? new Date(metric.reported_time) : null,
    }));
  }

  /**
   * Get device metrics for a specific node
   */
  async getNodeDeviceMetrics(id: number, params?: DateRangeParams): Promise<DeviceMetrics[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('start_date', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('end_date', params.endDate.toISOString());

    const metrics = await this.get<DeviceMetrics[]>(`/nodes/observed-nodes/${id}/device_metrics/`, searchParams);
    return metrics.map((metric) => ({
      ...metric,
      logged_time: metric.logged_time != null ? new Date(metric.logged_time) : null,
      reported_time: metric.reported_time != null ? new Date(metric.reported_time) : null,
    }));
  }

  /**
   * Get positions for a specific node
   */
  async getNodePositions(id: number, params?: DateRangeParams): Promise<Position[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('start_date', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('end_date', params.endDate.toISOString());

    const positions = await this.get<Position[]>(`/nodes/observed-nodes/${id}/positions/`, searchParams);
    return positions.map((position) => ({
      ...position,
      logged_time: position.logged_time != null ? new Date(position.logged_time) : null,
      reported_time: position.reported_time != null ? new Date(position.reported_time) : null,
    }));
  }

  /**
   * Get claim status for a node
   */
  async getClaimStatus(nodeId: number): Promise<NodeClaim | undefined> {
    const response = await this.get<NodeClaim>(`/nodes/observed-nodes/${nodeId}/claim/`);
    return response;
  }

  /**
   * Claim a node
   */
  async claimNode(nodeId: number): Promise<NodeClaim> {
    return this.post<NodeClaim>(`/nodes/observed-nodes/${nodeId}/claim/`);
  }

  /**
   * Get all node claims for the current user
   * @returns Array of NodeClaim objects
   */
  async getMyClaims(): Promise<NodeClaim[]> {
    return this.get<NodeClaim[]>('/nodes/claims/mine/');
  }

  // ===== Managed Nodes API =====

  /**
   * Get a paginated list of managed nodes
   */
  async getManagedNodes(params?: PaginationParams): Promise<PaginatedResponse<ManagedNode>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    return this.get<PaginatedResponse<ManagedNode>>('/nodes/managed-nodes/', searchParams);
  }

  /**
   * Get a paginated list of managed nodes owned by the current user
   */
  async getMyManagedNodes(params?: PaginationParams): Promise<PaginatedResponse<OwnedManagedNode>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    return this.get<PaginatedResponse<OwnedManagedNode>>('/nodes/managed-nodes/mine/', searchParams);
  }

  /**
   * Get a single managed node by ID
   */
  async getManagedNode(id: number): Promise<ManagedNode> {
    return this.get<ManagedNode>(`/nodes/managed-nodes/${id}/`);
  }

  /**
   * Create a managed node
   */
  async createManagedNode(
    nodeId: number,
    constellationId: number,
    name: string,
    ownerId: number | null,
    options?: {
      defaultLocationLatitude?: number;
      defaultLocationLongitude?: number;
      channels?: {
        channel_0?: number | null;
        channel_1?: number | null;
        channel_2?: number | null;
        channel_3?: number | null;
        channel_4?: number | null;
        channel_5?: number | null;
        channel_6?: number | null;
        channel_7?: number | null;
      };
    }
  ): Promise<OwnedManagedNode> {
    const data: CreateManagedNode = {
      node_id: nodeId,
      constellation_id: constellationId,
      name: name,
      owner_id: ownerId,
      default_location_latitude: options?.defaultLocationLatitude ?? null,
      default_location_longitude: options?.defaultLocationLongitude ?? null,
      channel_0: options?.channels?.channel_0 ?? null,
      channel_1: options?.channels?.channel_1 ?? null,
      channel_2: options?.channels?.channel_2 ?? null,
      channel_3: options?.channels?.channel_3 ?? null,
      channel_4: options?.channels?.channel_4 ?? null,
      channel_5: options?.channels?.channel_5 ?? null,
      channel_6: options?.channels?.channel_6 ?? null,
      channel_7: options?.channels?.channel_7 ?? null,
    };

    return this.post<OwnedManagedNode>('/nodes/managed-nodes/', data);
  }

  // ===== API Keys =====

  /**
   * Get a list of API keys
   */
  async getApiKeys(): Promise<NodeApiKey[]> {
    const response = await this.get<PaginatedResponse<NodeApiKey>>('/nodes/api-keys/');
    return response.results;
  }

  /**
   * Create an API key
   */
  async createApiKey(name: string, constellationId: number): Promise<NodeApiKey> {
    const data: CreateNodeApiKey = {
      name,
      constellation: constellationId,
    };

    return this.post<NodeApiKey>('/nodes/api-keys/', data);
  }

  /**
   * Add a node to an API key
   */
  async addNodeToApiKey(apiKeyId: string, nodeId: number): Promise<NodeApiKey> {
    return this.post<NodeApiKey>(`/nodes/api-keys/${apiKeyId}/add_node/`, { node_id: nodeId });
  }

  /**
   * Remove a node from an API key
   */
  async removeNodeFromApiKey(apiKeyId: string, nodeId: number): Promise<NodeApiKey> {
    return this.post<NodeApiKey>(`/nodes/api-keys/${apiKeyId}/remove_node/`, { node_id: nodeId });
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(apiKeyId: string): Promise<void> {
    await this.delete<void>(`/nodes/api-keys/${apiKeyId}/`);
  }

  /**
   * Update an API key (name, is_active). Uses PATCH for partial updates.
   */
  async updateApiKey(apiKeyId: string, data: { name?: string; is_active?: boolean }): Promise<NodeApiKey> {
    return this.patch<NodeApiKey>(`/nodes/api-keys/${apiKeyId}/`, data);
  }

  // ===== Constellations API =====

  /**
   * Get a paginated list of constellations
   */
  async getConstellations(params?: PaginationParams): Promise<PaginatedResponse<Constellation>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    return this.get<PaginatedResponse<Constellation>>('/constellations', searchParams);
  }

  /**
   * Get channels for a constellation
   */
  async getConstellationChannels(constellationId: number): Promise<MessageChannel[]> {
    return this.get<MessageChannel[]>(`/constellations/${constellationId}/channels/`);
  }

  // ===== Messages API =====

  /**
   * Get text messages
   */
  async getTextMessages(params: {
    channelId?: number;
    constellationId?: number;
    page?: number;
    page_size?: number;
  }): Promise<TextMessageResponse> {
    const searchParams = new URLSearchParams();
    if (params.channelId) searchParams.append('channel_id', params.channelId.toString());
    if (params.constellationId) searchParams.append('constellation_id', params.constellationId.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.page_size) searchParams.append('page_size', params.page_size.toString());
    return this.get<TextMessageResponse>('/messages/text/', searchParams);
  }

  /**
   * Get a single text message
   */
  async getTextMessage(id: string): Promise<TextMessage> {
    return this.get<TextMessage>(`/messages/text/${id}/`);
  }

  // ===== Stats API =====

  /**
   * Get global stats
   */
  async getGlobalStats(params?: DateRangeIntervalParams): Promise<GlobalStats> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('start_date', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('end_date', params.endDate.toISOString());
    if (params?.interval) searchParams.append('interval', params.interval.toString());
    if (params?.intervalType) searchParams.append('interval_type', params.intervalType);

    const response = await this.get<GlobalStats>('/stats/global/', searchParams);
    return {
      ...response,
      intervals: response.intervals.map((interval) => ({
        ...interval,
        start_date: new Date(interval.start_date).toISOString(),
        end_date: new Date(interval.end_date).toISOString(),
      })),
      summary: {
        ...response.summary,
        time_range: {
          start: new Date(response.summary.time_range.start).toISOString(),
          end: new Date(response.summary.time_range.end).toISOString(),
        },
      },
    };
  }

  /**
   * Get node stats
   */
  async getNodeStats(nodeId: number, params?: DateRangeIntervalParams): Promise<GlobalStats> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('start_date', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('end_date', params.endDate.toISOString());
    if (params?.interval) searchParams.append('interval', params.interval.toString());
    if (params?.intervalType) searchParams.append('interval_type', params.intervalType);

    const response = await this.get<GlobalStats>(`/stats/nodes/${nodeId}/packets/`, searchParams);
    return {
      ...response,
      intervals: response.intervals.map((interval) => ({
        ...interval,
        start_date: new Date(interval.start_date).toISOString(),
        end_date: new Date(interval.end_date).toISOString(),
      })),
    };
  }

  /**
   * Get node received stats (packets heard by the node)
   */
  async getNodeReceivedStats(nodeId: number, params?: DateRangeIntervalParams): Promise<GlobalStats> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('start_date', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('end_date', params.endDate.toISOString());
    if (params?.interval) searchParams.append('interval', params.interval.toString());
    if (params?.intervalType) searchParams.append('interval_type', params.intervalType);

    const response = await this.get<GlobalStats>(`/stats/nodes/${nodeId}/received/`, searchParams);
    return {
      ...response,
      intervals: response.intervals.map((interval) => ({
        ...interval,
        start_date: new Date(interval.start_date).toISOString(),
        end_date: new Date(interval.end_date).toISOString(),
      })),
    };
  }

  /**
   * Get stored stats snapshots with optional filters
   */
  async getStatsSnapshots(params?: StatsSnapshotsParams): Promise<PaginatedResponse<StatsSnapshot>> {
    const searchParams = new URLSearchParams();
    if (params?.statType) searchParams.append('stat_type', params.statType);
    if (params?.constellationId != null) searchParams.append('constellation_id', params.constellationId.toString());
    if (params?.recordedAtAfter) searchParams.append('recorded_at_after', params.recordedAtAfter.toISOString());
    if (params?.recordedAtBefore) searchParams.append('recorded_at_before', params.recordedAtBefore.toISOString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());

    return this.get<PaginatedResponse<StatsSnapshot>>('/stats/snapshots/', searchParams);
  }

  /**
   * Get neighbour stats (packets received by source node) for a managed node
   */
  async getNodeNeighbourStats(nodeId: number, params?: DateRangeParams): Promise<NeighbourStats> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('start_date', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('end_date', params.endDate.toISOString());

    return this.get(`/stats/nodes/${nodeId}/neighbours/`, searchParams);
  }

  // ===== Traceroutes API =====

  /**
   * Get traceroute history with optional filters
   */
  async getTraceroutes(params?: {
    managed_node?: number;
    source_node?: number;
    target_node?: number;
    status?: string;
    trigger_type?: string;
    triggered_after?: string;
    triggered_before?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<AutoTraceRoute>> {
    const searchParams = new URLSearchParams();
    if (params?.managed_node) searchParams.append('managed_node', params.managed_node.toString());
    if (params?.source_node) searchParams.append('source_node', params.source_node.toString());
    if (params?.target_node) searchParams.append('target_node', params.target_node.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.trigger_type) searchParams.append('trigger_type', params.trigger_type);
    if (params?.triggered_after) searchParams.append('triggered_after', params.triggered_after);
    if (params?.triggered_before) searchParams.append('triggered_before', params.triggered_before);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    return this.get<PaginatedResponse<AutoTraceRoute>>('/traceroutes/', searchParams);
  }

  /**
   * Get a single traceroute by ID
   */
  async getTraceroute(id: number): Promise<AutoTraceRoute> {
    return this.get<AutoTraceRoute>(`/traceroutes/${id}/`);
  }

  /**
   * Trigger a traceroute manually
   */
  async triggerTraceroute(managedNodeId: number, targetNodeId?: number): Promise<AutoTraceRoute> {
    const data: { managed_node_id: number; target_node_id?: number } = { managed_node_id: managedNodeId };
    if (targetNodeId != null) data.target_node_id = targetNodeId;
    return this.post<AutoTraceRoute>('/traceroutes/trigger/', data);
  }

  /**
   * Check if the current user can trigger traceroutes
   */
  async canTriggerTraceroute(): Promise<{ can_trigger: boolean }> {
    return this.get<{ can_trigger: boolean }>('/traceroutes/can_trigger/');
  }

  /**
   * Get ManagedNodes the current user can trigger traceroutes from
   */
  async getTracerouteTriggerableNodes(): Promise<ManagedNode[]> {
    return this.get<ManagedNode[]>('/traceroutes/triggerable-nodes/');
  }

  /**
   * Get aggregated heatmap edges and nodes for traceroute visualization
   */
  async getHeatmapEdges(params?: {
    triggered_at_after?: string;
    constellation_id?: number;
    bbox?: [number, number, number, number];
  }): Promise<{
    edges: Array<{
      from_node_id: number;
      to_node_id: number;
      from_lat: number;
      from_lng: number;
      to_lat: number;
      to_lng: number;
      weight: number;
    }>;
    nodes: Array<{
      node_id: number;
      node_id_str: string;
      lat: number;
      lng: number;
      short_name?: string;
      long_name?: string;
    }>;
    meta: {
      active_nodes_count: number;
      total_trace_routes_count: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.triggered_at_after) {
      searchParams.append('triggered_at_after', params.triggered_at_after);
    }
    if (params?.constellation_id != null) {
      searchParams.append('constellation_id', params.constellation_id.toString());
    }
    if (params?.bbox && params.bbox.length >= 4) {
      searchParams.append('bbox', params.bbox.join(','));
    }
    return this.get('/traceroutes/heatmap-edges/', searchParams);
  }

  /**
   * Get traceroute links for a specific node (from Neo4j)
   */
  async getNodeTracerouteLinks(
    nodeId: number,
    params?: { triggered_at_after?: string }
  ): Promise<{
    edges: Array<{
      from_node_id: number;
      to_node_id: number;
      from_lat: number;
      from_lng: number;
      to_lat: number;
      to_lng: number;
      avg_snr_in: number | null;
      avg_snr_out: number | null;
      count: number;
    }>;
    nodes: Array<{
      node_id: number;
      node_id_str?: string;
      lat: number;
      lng: number;
      short_name?: string;
      long_name?: string;
    }>;
    snr_history: Array<{
      peer_node_id: number;
      peer_short_name: string;
      inbound: Array<{ triggered_at: string; snr: number }>;
      outbound: Array<{ triggered_at: string; snr: number }>;
    }>;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.triggered_at_after) {
      searchParams.append('triggered_at_after', params.triggered_at_after);
    }
    return this.get(`/nodes/observed-nodes/${nodeId}/traceroute-links/`, searchParams);
  }
}
