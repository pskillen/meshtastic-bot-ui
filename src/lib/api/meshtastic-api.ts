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
  Constellation,
  MessageChannel,
  TextMessage,
  TextMessageResponse,
  NodeClaim,
  CreateManagedNode,
  NodeApiKey,
  CreateNodeApiKey,
} from '../models';
import { ApiConfig, DateRangeParams, DateRangeIntervalParams, PaginationParams } from '@/lib/types';
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
   * Search for observed nodes
   */
  async searchNodes(query: string): Promise<NodeSearchResult[]> {
    if (!query.trim()) return [];
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    return this.get<NodeSearchResult[]>('/nodes/observed-nodes/search/', searchParams);
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
      logged_time: new Date(metric.logged_time),
      reported_time: new Date(metric.reported_time),
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
      logged_time: new Date(position.logged_time),
      reported_time: new Date(position.reported_time),
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
    const response = await this.get<NodeApiKey[]>('/nodes/api-keys/');
    return response;
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
}
