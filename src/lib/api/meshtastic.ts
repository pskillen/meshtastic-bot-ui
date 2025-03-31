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
    return this.get<NodeData[]>('/nodes/');
  }

  async getNode(id: number): Promise<NodeData> {
    return this.get<NodeData>(`/nodes/${id}/`);
  }

  async getNodeDeviceMetrics(
    id: number,
    params?: DateRangeParams
  ): Promise<DeviceMetrics[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const queryString = searchParams.toString();
    return this.get<DeviceMetrics[]>(
      `/nodes/${id}/device_metrics/${queryString ? `?${queryString}` : ''}`
    );
  }

  async getNodePositions(
    id: number,
    params?: DateRangeParams
  ): Promise<Position[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const queryString = searchParams.toString();
    return this.get<Position[]>(
      `/nodes/${id}/positions/${queryString ? `?${queryString}` : ''}`
    );
  }

  async searchNodes(query: string): Promise<NodeSearchResult[]> {
    if (!query.trim()) return [];
    return this.get<NodeSearchResult[]>(`/nodes/search/?q=${encodeURIComponent(query)}`);
  }

  async getPacketStats(params?: PacketStatsParams): Promise<PacketStatsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.nodeId) searchParams.append('nodeId', params.nodeId.toString());
    if (params?.channel) searchParams.append('channel', params.channel.toString());

    const queryString = searchParams.toString();
    return this.get<PacketStatsResponse>(
      `/stats/${queryString ? `?${queryString}` : ''}`
    );
  }
} 