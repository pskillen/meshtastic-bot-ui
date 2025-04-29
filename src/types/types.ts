export interface ApiAuthConfig {
  type: 'none' | 'token' | 'basic' | 'oauth' | 'apiKey';
  token?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  apiKeyHeader?: string; // Default is 'X-API-Key' for Meshflow API v2
}

export interface ApiConfig {
  baseUrl: string;
  basePath?: string;
  timeout: number;
  auth: ApiAuthConfig;
  headers?: Record<string, string>;
}

export interface AppConfig {
  version: string;
  apis: {
    meshBot: ApiConfig;
  };
  map: {
    defaultCenter: [number, number];
    defaultZoom: number;
  };
  refresh: {
    nodesList: number; // milliseconds
    nodeDetails: number;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}
