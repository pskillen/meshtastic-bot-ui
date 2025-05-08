import { BaseApi } from './base';
import {
  NodeData,
  ObservedNode,
  ManagedNode,
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
} from '../models';
import { DateRangeParams, DateRangeIntervalParams, PaginationParams } from '../types';
import { ApiConfig } from '@/types/types';

export class MeshtasticApi extends BaseApi {
  constructor(config: ApiConfig) {
    super(config);
  }

  // Convert ObservedNode to NodeData for backward compatibility
  private observedNodeToNodeData(node: ObservedNode): NodeData {
    return {
      ...node,
      id: node.internal_id,
      hardware_model: node.hw_model,
      meshtastic_version: node.sw_version,
      last_heard: node.last_heard ? new Date(node.last_heard) : null,
      latest_position: node.latest_position
        ? {
            ...node.latest_position,
            logged_time: new Date(node.latest_position.logged_time),
            reported_time: new Date(node.latest_position.reported_time),
          }
        : null,
      latest_device_metrics: node.latest_device_metrics
        ? {
            ...node.latest_device_metrics,
            logged_time: new Date(node.latest_device_metrics.logged_time),
            reported_time: new Date(node.latest_device_metrics.reported_time),
          }
        : null,
    };
  }

  async getNodes(params?: PaginationParams): Promise<PaginatedResponse<NodeData>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());

    const response = await this.get<PaginatedResponse<ObservedNode>>('/nodes/observed-nodes/', searchParams);
    return {
      ...response,
      results: response.results.map((node) => this.observedNodeToNodeData(node)),
    };
  }

  async getMyClaimedNodes(): Promise<NodeData[]> {
    const nodes = await this.get<ObservedNode[]>('/nodes/observed-nodes/mine/');
    return nodes.map((node) => this.observedNodeToNodeData(node));
  }

  async getNode(id: number): Promise<NodeData> {
    const node = await this.get<ObservedNode>(`/nodes/observed-nodes/${id}/`);
    return this.observedNodeToNodeData(node);
  }

  async getManagedNodes(): Promise<ManagedNode[]> {
    const response = await this.get<PaginatedResponse<ManagedNode>>('/nodes/managed-nodes/');
    return response.results;
  }

  async getMyManagedNodes(): Promise<ManagedNode[]> {
    const response = await this.get<ManagedNode[]>('/nodes/managed-nodes/mine/');
    return response;
  }

  async getManagedNode(id: number): Promise<ManagedNode> {
    return this.get<ManagedNode>(`/nodes/managed-nodes/${id}/`);
  }

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

  async searchNodes(query: string): Promise<NodeSearchResult[]> {
    if (!query.trim()) return [];
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    return this.get<NodeSearchResult[]>('/nodes/observed-nodes/search/', searchParams);
  }

  // Message API methods
  async getMessages(params?: {
    channel?: number;
    node?: number;
    limit?: number;
    offset?: number;
  }): Promise<TextMessageResponse> {
    const searchParams = new URLSearchParams();
    if (params?.channel !== undefined) searchParams.append('channel', params.channel.toString());
    if (params?.node !== undefined) searchParams.append('node', params.node.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    return this.get<TextMessageResponse>('/messages/', searchParams);
  }

  async getMessage(id: string): Promise<TextMessage> {
    return this.get<TextMessage>(`/messages/${id}/`);
  }

  async getMessagesByChannel(
    channel: number,
    params?: { limit?: number; offset?: number }
  ): Promise<TextMessageResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('channel', channel.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    return this.get<TextMessageResponse>('/messages/by_channel/', searchParams);
  }

  async getMessagesByNode(nodeId: number, params?: { limit?: number; offset?: number }): Promise<TextMessageResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('node', nodeId.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    return this.get<TextMessageResponse>('/messages/by_node/', searchParams);
  }

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

  async getConstellations(): Promise<Constellation[]> {
    const response = await this.get<PaginatedResponse<Constellation>>('/constellations');
    return response.results;
  }

  async getConstellationChannels(constellationId: number): Promise<MessageChannel[]> {
    return this.get<MessageChannel[]>(`/constellations/${constellationId}/channels`);
  }

  /**
   * Fetch messages using the v2 endpoint: /messages/text?channel_id=...&constellation_id=...
   * Supports pagination via page and page_size.
   */
  async getTextMessagesByChannelAndConstellation(params: {
    channelId: number;
    constellationId: number;
    page?: number;
    page_size?: number;
  }): Promise<TextMessageResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('channel_id', params.channelId.toString());
    searchParams.append('constellation_id', params.constellationId.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.page_size) searchParams.append('page_size', params.page_size.toString());
    return this.get<TextMessageResponse>('/messages/text/', searchParams);
  }

  /**
   * Initiate a claim for a node
   * @param nodeId The ID of the node to claim
   * @returns A response containing the claim key
   */
  async claimNode(nodeId: number): Promise<NodeClaim> {
    return this.post<NodeClaim>(`/nodes/observed-nodes/${nodeId}/claim/`);
  }

  /**
   * Check the status of a node claim
   * @param nodeId The ID of the node being claimed
   * @returns The current status of the claim
   */
  async getClaimStatus(nodeId: number): Promise<NodeClaim | undefined> {
    try {
      const response = await this.get<NodeClaim>(`/nodes/observed-nodes/${nodeId}/claim/`);
      return response;
    } catch (error) {
      if (error instanceof Error && error.message === 'No data returned from server') {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Create a managed node from a claimed node
   * @param nodeId The ID of the claimed node
   * @param constellationId The ID of the constellation to add the node to
   * @param name The name for the managed node
   * @returns The created managed node
   */
  async createManagedNode(nodeId: number, constellationId: number, name: string): Promise<ManagedNode> {
    const data = {
      node_id: nodeId,
      constellation: constellationId,
      name: name,
    };
    return this.post<ManagedNode>('/nodes/managed-nodes/', data);
  }

  /**
   * Get API keys owned by the current user
   * @returns List of API keys
   */
  async getApiKeys(): Promise<any[]> {
    const response = await this.get<any>('/nodes/api-keys/');
    return response.results || [];
  }

  /**
   * Create a new API key
   * @param name The name for the API key
   * @param constellationId The ID of the constellation for the API key
   * @param nodeIds Optional list of node IDs to associate with the API key
   * @returns The created API key
   */
  async createApiKey(name: string, constellationId: number, nodeIds?: number[]): Promise<any> {
    const data: any = {
      name,
      constellation: constellationId,
    };

    if (nodeIds && nodeIds.length > 0) {
      data.nodes = nodeIds;
    }

    return this.post<any>('/nodes/api-keys/', data);
  }

  /**
   * Add a node to an API key
   * @param apiKeyId The ID of the API key
   * @param nodeId The ID of the node to add
   * @returns Success response
   */
  async addNodeToApiKey(apiKeyId: string, nodeId: number): Promise<any> {
    return this.post<any>(`/nodes/api-keys/${apiKeyId}/add_node/`, { node_id: nodeId });
  }
}
