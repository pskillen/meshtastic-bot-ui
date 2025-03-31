#!/bin/sh

# Replace environment variables in config.ts
sed -i "s|const MESHBOT_API_URL = '.*'|const MESHBOT_API_URL = '${MESHBOT_API_URL:-http://api:8000}'|" /usr/share/nginx/html/assets/config.js
sed -i "s|const MESHBOT_API_BASE_PATH = '.*'|const MESHBOT_API_BASE_PATH = '${MESHBOT_API_BASE_PATH:-/api/ui}'|" /usr/share/nginx/html/assets/config.js
sed -i "s|const MESHBOT_API_TIMEOUT = .*|const MESHBOT_API_TIMEOUT = ${MESHBOT_API_TIMEOUT:-10000}|" /usr/share/nginx/html/assets/config.js
sed -i "s|const MESHBOT_API_TOKEN = '.*'|const MESHBOT_API_TOKEN = '${MESHBOT_API_TOKEN}'|" /usr/share/nginx/html/assets/config.js
sed -i "s|const MAP_DEFAULT_CENTER_LAT = .*|const MAP_DEFAULT_CENTER_LAT = ${MAP_DEFAULT_CENTER_LAT:-0}|" /usr/share/nginx/html/assets/config.js
sed -i "s|const MAP_DEFAULT_CENTER_LNG = .*|const MAP_DEFAULT_CENTER_LNG = ${MAP_DEFAULT_CENTER_LNG:-0}|" /usr/share/nginx/html/assets/config.js
sed -i "s|const MAP_DEFAULT_ZOOM = .*|const MAP_DEFAULT_ZOOM = ${MAP_DEFAULT_ZOOM:-2}|" /usr/share/nginx/html/assets/config.js

# Start nginx
exec nginx -g 'daemon off;' 