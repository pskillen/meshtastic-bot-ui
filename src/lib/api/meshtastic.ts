import { BaseApi, ApiConfig } from './base';
import {
  NodeData,
  DeviceMetrics,
  Position,
  NodeSearchResult,
  DateRangeParams,
} from '../models';

export class MeshtasticApi extends BaseApi {
  constructor(config: ApiConfig) {
    super(config);
  }

  // Node endpoints
  async getNode(id: number): Promise<NodeData> {
    return this.get<NodeData>(`/api/nodes/${id}/`);
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
      `/api/nodes/${id}/device_metrics/${queryString ? `?${queryString}` : ''}`
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
      `/api/nodes/${id}/positions/${queryString ? `?${queryString}` : ''}`
    );
  }

  async searchNodes(query: string): Promise<NodeSearchResult[]> {
    if (!query.trim()) return [];
    return this.get<NodeSearchResult[]>(`/api/nodes/search/?q=${encodeURIComponent(query)}`);
  }

  // Helper method to create an instance with default configuration
  static create(baseUrl: string): MeshtasticApi {
    return new MeshtasticApi({
      baseUrl,
      headers: {
        'Accept': 'application/json',
      },
    });
  }
} 