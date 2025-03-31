import { AppConfig } from "@/types/types";

// These vars may be overwritten by a build script
const MESHBOT_API_URL = 'http://localhost:8000';
const MESHBOT_API_BASE_PATH = '/api/ui';
const MESHBOT_API_TIMEOUT = 10000;
const MESHBOT_API_TOKEN = 'd9891a1ed5541ae02392b9829cb68267bf68e06c';
const MAP_DEFAULT_CENTER_LAT = 0;
const MAP_DEFAULT_CENTER_LNG = 0;
const MAP_DEFAULT_ZOOM = 2;

// Default configuration from environment variables
const config: AppConfig = {
  apis: {
    meshBot: {
      baseUrl: MESHBOT_API_URL,
      basePath: MESHBOT_API_BASE_PATH,
      timeout: MESHBOT_API_TIMEOUT,
      auth: {
        type: 'token',
        token: MESHBOT_API_TOKEN,
      },
      headers: {
        'Accept': 'application/json',
      },
    },
  },
  map: {
    defaultCenter: [
      MAP_DEFAULT_CENTER_LAT,
      MAP_DEFAULT_CENTER_LNG
    ],
    defaultZoom: MAP_DEFAULT_ZOOM,
  },
  refresh: {
    nodesList: 30000, // 30 seconds
    nodeDetails: 10000, // 10 seconds
  },
};

export default config;