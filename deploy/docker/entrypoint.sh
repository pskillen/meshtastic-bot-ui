#!/bin/sh

# Create config.json from environment variables
cat > /usr/share/nginx/html/config.json << EOF
{
  "apis": {
    "meshBot": {
      "baseUrl": "${MESHBOT_API_URL:-http://localhost:8000}",
      "basePath": "${MESHBOT_API_BASE_PATH:-/api/ui}",
      "timeout": ${MESHBOT_API_TIMEOUT:-10000},
      "auth": {
        "type": "token",
        "token": "${MESHBOT_API_TOKEN:-d9891a1ed5541ae02392b9829cb68267bf68e06c}"
      },
      "headers": {
        "Accept": "application/json"
      }
    }
  },
  "map": {
    "defaultCenter": [${MAP_DEFAULT_CENTER_LAT:-0}, ${MAP_DEFAULT_CENTER_LNG:-0}],
    "defaultZoom": ${MAP_DEFAULT_ZOOM:-2}
  },
  "refresh": {
    "nodesList": ${REFRESH_NODES_LIST:-30000},
    "nodeDetails": ${REFRESH_NODE_DETAILS:-10000}
  }
}
EOF

# Start nginx
exec nginx -g 'daemon off;' 