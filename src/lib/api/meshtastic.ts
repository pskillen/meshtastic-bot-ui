import { BaseApi } from './base';
import {
  NodeData,
  ObservedNode,
  ManagedNode,
  DeviceMetrics,
  Position,
  NodeSearchResult,
  DateRangeParams,
  PacketStatsResponse,
  PacketStatsParams,
  Message,
  MessageResponse,
} from '../models';
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
      last_position: node.last_position
        ? {
            ...node.last_position,
            time: new Date(node.last_position.time),
            reported_time: new Date(node.last_position.reported_time),
          }
        : null,
      latest_device_metrics: node.latest_device_metrics
        ? {
            ...node.latest_device_metrics,
            time: new Date(node.latest_device_metrics.time),
          }
        : null,
    };
  }

  async getNodes(): Promise<NodeData[]> {
    const nodes = await this.get<ObservedNode[]>('/nodes/observed-nodes/');
    return nodes.map((node) => this.observedNodeToNodeData(node));
  }

  async getNode(id: number): Promise<NodeData> {
    const node = await this.get<ObservedNode>(`/nodes/observed-nodes/${id}/`);
    return this.observedNodeToNodeData(node);
  }

  async getManagedNodes(): Promise<ManagedNode[]> {
    return this.get<ManagedNode[]>('/nodes/managed-nodes/');
  }

  async getManagedNode(id: number): Promise<ManagedNode> {
    return this.get<ManagedNode>(`/nodes/managed-nodes/${id}/`);
  }

  async getNodeDeviceMetrics(id: number, params?: DateRangeParams): Promise<DeviceMetrics[]> {
    // Note: This endpoint might need to be updated based on the actual API implementation
    // This is a placeholder based on the current implementation
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('endDate', params.endDate.toISOString());

    const queryString = searchParams.toString();
    const metrics = await this.get<DeviceMetrics[]>(
      `/nodes/observed-nodes/${id}/device_metrics${queryString ? `?${queryString}` : ''}`
    );
    return metrics.map((metric) => ({
      ...metric,
      time: new Date(metric.time),
    }));
  }

  async getNodePositions(id: number, params?: DateRangeParams): Promise<Position[]> {
    // Note: This endpoint might need to be updated based on the actual API implementation
    // This is a placeholder based on the current implementation
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('endDate', params.endDate.toISOString());

    const queryString = searchParams.toString();
    const positions = await this.get<Position[]>(
      `/nodes/observed-nodes/${id}/positions${queryString ? `?${queryString}` : ''}`
    );
    return positions.map((position) => ({
      ...position,
      time: new Date(position.time),
      reported_time: new Date(position.reported_time),
    }));
  }

  async searchNodes(query: string): Promise<NodeSearchResult[]> {
    if (!query.trim()) return [];
    // Note: This endpoint might need to be updated based on the actual API implementation
    // This is a placeholder based on the current implementation
    return this.get<NodeSearchResult[]>(`/nodes/observed-nodes/search/?q=${encodeURIComponent(query)}`);
  }

  async getPacketStats(params?: PacketStatsParams): Promise<PacketStatsResponse> {
    // Note: This endpoint might need to be updated based on the actual API implementation
    // This is a placeholder based on the current implementation
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('endDate', params.endDate.toISOString());
    if (params?.nodeId) searchParams.append('nodeId', params.nodeId.toString());
    if (params?.channel) searchParams.append('channel', params.channel.toString());

    const queryString = searchParams.toString();
    const stats = await this.get<PacketStatsResponse>(`/stats${queryString ? `?${queryString}` : ''}`);
    return {
      ...stats,
      hourly_stats: stats.hourly_stats.map((stat) => ({
        ...stat,
        timestamp: new Date(stat.timestamp),
      })),
      summary: {
        ...stats.summary,
        time_range: {
          start: stats.summary.time_range.start ? new Date(stats.summary.time_range.start) : null,
          end: stats.summary.time_range.end ? new Date(stats.summary.time_range.end) : null,
        },
      },
    };
  }

  // Message API methods
  async getMessages(params?: {
    channel?: number;
    node?: number;
    limit?: number;
    offset?: number;
  }): Promise<MessageResponse> {
    const searchParams = new URLSearchParams();
    if (params?.channel !== undefined) searchParams.append('channel', params.channel.toString());
    if (params?.node !== undefined) searchParams.append('node', params.node.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    return this.get<MessageResponse>(`/messages/${queryString ? `?${queryString}` : ''}`);
  }

  async getMessage(id: string): Promise<Message> {
    return this.get<Message>(`/messages/${id}/`);
  }

  async getMessagesByChannel(channel: number, params?: { limit?: number; offset?: number }): Promise<MessageResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('channel', channel.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    return this.get<MessageResponse>(`/messages/by_channel/?${queryString}`);
  }

  async getMessagesByNode(nodeId: number, params?: { limit?: number; offset?: number }): Promise<MessageResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('node', nodeId.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    return this.get<MessageResponse>(`/messages/by_node/?${queryString}`);
  }
}
