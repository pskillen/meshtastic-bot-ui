interface AuthConfig {
  type: 'none' | 'token' | 'basic' | 'oauth' | 'apiKey';
  token?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  apiKeyHeader?: string;
}

interface ApiConfig {
  baseUrl: string;
  basePath?: string;
  timeout: number;
  auth: AuthConfig;
  headers?: Record<string, string>;
}

interface Config {
  apis: {
    meshBot: ApiConfig;
  };
  map: {
    defaultCenter: [number, number];
    defaultZoom: number;
  };
  refresh: {
    nodesList: number;  // milliseconds
    nodeDetails: number;
  };
}

const config: Config = {
  apis: {
    meshBot: {
      baseUrl: 'http://localhost:8000',
      basePath: '/api/ui',
      timeout: 10000, // 10 seconds
      auth: {
        type: 'token',
        token: 'd9891a1ed5541ae02392b9829cb68267bf68e06c', // TODO: we'll be requesting this from the token api and storing in localstoarage
        // username: import.meta.env.VITE_API_USERNAME,
        // password: import.meta.env.VITE_API_PASSWORD,
        // apiKey: import.meta.env.VITE_API_KEY,
        // apiKeyHeader: 'X-API-Key',
      },
      headers: {
        'Accept': 'application/json',
      },
    },
  },
  map: {
    defaultCenter: [0, 0],
    defaultZoom: 2,
  },
  refresh: {
    nodesList: 30000,    // 30 seconds
    nodeDetails: 10000,  // 10 seconds
  },
};

export default config; 