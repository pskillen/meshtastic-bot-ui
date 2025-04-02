import { BaseApi } from './base';
import {
  NodeData,
  DeviceMetrics,
  Position,
  NodeSearchResult,
  DateRangeParams,
  PacketStatsResponse,
  PacketStatsParams,
} from '../models';
import { ApiConfig } from '@/types/types';

export class MeshtasticApi extends BaseApi {
  constructor(config: ApiConfig) {
    super(config);
  }

  async getNodes(): Promise<NodeData[]> {
    const nodes = await this.get<NodeData[]>('/nodes/');
    return nodes.map((node) => ({
      ...node,
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
    }));
  }

  async getNode(id: number): Promise<NodeData> {
    const node = await this.get<NodeData>(`/nodes/${id}/`);
    return {
      ...node,
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

  async getNodeDeviceMetrics(id: number, params?: DateRangeParams): Promise<DeviceMetrics[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('endDate', params.endDate.toISOString());

    const queryString = searchParams.toString();
    const metrics = await this.get<DeviceMetrics[]>(
      `/nodes/${id}/device_metrics/${queryString ? `?${queryString}` : ''}`
    );
    return metrics.map((metric) => ({
      ...metric,
      time: new Date(metric.time),
    }));
  }

  async getNodePositions(id: number, params?: DateRangeParams): Promise<Position[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('endDate', params.endDate.toISOString());

    const queryString = searchParams.toString();
    const positions = await this.get<Position[]>(`/nodes/${id}/positions/${queryString ? `?${queryString}` : ''}`);
    return positions.map((position) => ({
      ...position,
      time: new Date(position.time),
      reported_time: new Date(position.reported_time),
    }));
  }

  async searchNodes(query: string): Promise<NodeSearchResult[]> {
    if (!query.trim()) return [];
    return this.get<NodeSearchResult[]>(`/nodes/search/?q=${encodeURIComponent(query)}`);
  }

  async getPacketStats(params?: PacketStatsParams): Promise<PacketStatsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) searchParams.append('endDate', params.endDate.toISOString());
    if (params?.nodeId) searchParams.append('nodeId', params.nodeId.toString());
    if (params?.channel) searchParams.append('channel', params.channel.toString());

    const queryString = searchParams.toString();
    const stats = await this.get<PacketStatsResponse>(`/stats/${queryString ? `?${queryString}` : ''}`);
    return {
      ...stats,
      hourly_stats: stats.hourly_stats.map((stat) => ({
        ...stat,
        timestamp: new Date(stat.timestamp),
      })),
      summary: {
        ...stats.summary,
        time_range: {
          start: new Date(stats.summary.time_range.start),
          end: new Date(stats.summary.time_range.end),
        },
      },
    };
  }
}
