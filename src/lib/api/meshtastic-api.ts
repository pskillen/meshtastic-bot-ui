import { BaseApi } from './base';
import {
  NodeData,
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
} from '../models';
import { DateRangeParams, DateRangeIntervalParams, PaginationParams } from '../types';
import { ApiConfig } from '@/types/types';

/**
 * MeshtasticApi class for interacting with the Meshtastic API
 * Implemented based on the openapi.yaml specification
 */
export class MeshtasticApi extends BaseApi {
  constructor(config: ApiConfig) {
    super(config);
  }

  // Helper method to convert ObservedNode to NodeData for backward compatibility
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

  // ===== Observed Nodes API =====

  /**
   * Get a paginated list of observed nodes
   */
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

  /**
   * Get a list of observed nodes owned by the current user
   */
  async getMyClaimedNodes(): Promise<NodeData[]> {
    const nodes = await this.get<ObservedNode[]>('/nodes/observed-nodes/mine/');
    return nodes.map((node) => this.observedNodeToNodeData(node));
  }

  /**
   * Get a single observed node by ID
   */
  async getNode(id: number): Promise<NodeData> {
    const node = await this.get<ObservedNode>(`/nodes/observed-nodes/${id}/`);
    return this.observedNodeToNodeData(node);
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

    const metrics = await this.get<DeviceMetrics[]>(`/nodes/observed-nodes/${id}/device-metrics/`, searchParams);
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
   * Claim a node
   */
  async claimNode(nodeId: number): Promise<NodeClaim> {
    return this.post<NodeClaim>(`/nodes/observed-nodes/${nodeId}/claim/`);
  }

  // ===== Managed Nodes API =====

  /**
   * Get a list of managed nodes
   */
  async getManagedNodes(): Promise<ManagedNode[]> {
    const response = await this.get<PaginatedResponse<ManagedNode>>('/nodes/managed-nodes/');
    return response.results;
  }

  /**
   * Get a list of managed nodes owned by the current user
   */
  async getMyManagedNodes(): Promise<OwnedManagedNode[]> {
    return this.get<OwnedManagedNode[]>('/nodes/managed-nodes/mine/');
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
    const data: any = {
      node_id: nodeId,
      constellation: constellationId,
      name: name,
    };

    // Add default location if provided
    if (options?.defaultLocationLatitude !== undefined) {
      data.default_location_latitude = options.defaultLocationLatitude;
    }
    if (options?.defaultLocationLongitude !== undefined) {
      data.default_location_longitude = options.defaultLocationLongitude;
    }

    // Add channel mappings if provided
    if (options?.channels) {
      const { channels } = options;
      if (channels.channel_0 !== undefined) data.channel_0 = channels.channel_0;
      if (channels.channel_1 !== undefined) data.channel_1 = channels.channel_1;
      if (channels.channel_2 !== undefined) data.channel_2 = channels.channel_2;
      if (channels.channel_3 !== undefined) data.channel_3 = channels.channel_3;
      if (channels.channel_4 !== undefined) data.channel_4 = channels.channel_4;
      if (channels.channel_5 !== undefined) data.channel_5 = channels.channel_5;
      if (channels.channel_6 !== undefined) data.channel_6 = channels.channel_6;
      if (channels.channel_7 !== undefined) data.channel_7 = channels.channel_7;
    }

    return this.post<OwnedManagedNode>('/nodes/managed-nodes/', data);
  }

  // ===== API Keys =====

  /**
   * Get a list of API keys
   */
  async getApiKeys(): Promise<any[]> {
    const response = await this.get<any>('/nodes/api-keys/');
    return response.results || [];
  }

  /**
   * Create an API key
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
   */
  async addNodeToApiKey(apiKeyId: string, nodeId: number): Promise<any> {
    return this.post<any>(`/nodes/api-keys/${apiKeyId}/add_node/`, { node_id: nodeId });
  }

  // ===== Constellations API =====

  /**
   * Get a list of constellations
   */
  async getConstellations(): Promise<Constellation[]> {
    const response = await this.get<PaginatedResponse<Constellation>>('/constellations');
    return response.results;
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
