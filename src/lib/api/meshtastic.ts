import { BaseApi } from './base';
import {
  NodeData,
  ObservedNode,
  ManagedNode,
  DeviceMetrics,
  Position,
  NodeSearchResult,
  Message,
  MessageResponse,
  PaginatedResponse,
  GlobalStats,
} from '../models';
import { DateRangeParams, DateRangeIntervalParams } from '../types';
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

  async getNodes(): Promise<NodeData[]> {
    const response = await this.get<PaginatedResponse<ObservedNode>>('/nodes/observed-nodes/');
    return response.results.map((node) => this.observedNodeToNodeData(node));
  }

  async getNode(id: number): Promise<NodeData> {
    const node = await this.get<ObservedNode>(`/nodes/observed-nodes/${id}/`);
    return this.observedNodeToNodeData(node);
  }

  async getManagedNodes(): Promise<ManagedNode[]> {
    const response = await this.get<PaginatedResponse<ManagedNode>>('/nodes/managed-nodes/');
    return response.results;
  }

  async getManagedNode(id: number): Promise<ManagedNode> {
    return this.get<ManagedNode>(`/nodes/managed-nodes/${id}/`);
  }

  async getNodeDeviceMetrics(id: number, params?: DateRangeParams): Promise<DeviceMetrics[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('endDate', params.endDate.toISOString());

    const metrics = await this.get<DeviceMetrics[]>(`/nodes/observed-nodes/${id}/device_metrics/`, searchParams);
    return metrics.map((metric) => ({
      ...metric,
      logged_time: new Date(metric.logged_time),
      reported_time: new Date(metric.reported_time),
    }));
  }

  async getNodePositions(id: number, params?: DateRangeParams): Promise<Position[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('endDate', params.endDate.toISOString());

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
  }): Promise<MessageResponse> {
    const searchParams = new URLSearchParams();
    if (params?.channel !== undefined) searchParams.append('channel', params.channel.toString());
    if (params?.node !== undefined) searchParams.append('node', params.node.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    return this.get<MessageResponse>('/messages/', searchParams);
  }

  async getMessage(id: string): Promise<Message> {
    return this.get<Message>(`/messages/${id}/`);
  }

  async getMessagesByChannel(channel: number, params?: { limit?: number; offset?: number }): Promise<MessageResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('channel', channel.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    return this.get<MessageResponse>('/messages/by_channel/', searchParams);
  }

  async getMessagesByNode(nodeId: number, params?: { limit?: number; offset?: number }): Promise<MessageResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('node', nodeId.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    return this.get<MessageResponse>('/messages/by_node/', searchParams);
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
}
