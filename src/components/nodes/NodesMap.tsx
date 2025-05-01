import { NodeData } from '@/lib/models';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

// Create a custom marker icon function
const createNodeIcon = (text: string) => {
  return L.divIcon({
    className: 'custom-node-marker',
    html: `
      <div class="marker-container">
        <div class="marker-pin"></div>
        <span class="marker-text">${text}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

interface NodesMapProps {
  nodes: NodeData[];
}

// Default center only used if no nodes are present
const DEFAULT_CENTER: L.LatLngExpression = [55.8642, -4.2518];

export function NodesMap({ nodes }: NodesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize the map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView(DEFAULT_CENTER, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Add CSS for custom markers and map container
      const style = document.createElement('style');
      style.textContent = `
        .custom-node-marker {
          background: transparent;
          border: none;
        }
        .marker-container {
          position: relative;
          text-align: center;
        }
        .marker-pin {
          width: 35px;
          height: 35px;
          border-radius: 50% 50% 50% 0;
          background: #00a1e1;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -15px 0 0 -10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .marker-text {
          position: absolute;
          width: 40px;
          left: 60%;
          transform: translateX(-50%);
          top: -5px;
          text-align: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        /* Fix map container z-index issues */
        .leaflet-container {
          z-index: 1;
        }
        .leaflet-pane,
        .leaflet-tile,
        .leaflet-marker-icon,
        .leaflet-marker-shadow,
        .leaflet-tile-container,
        .leaflet-pane > svg,
        .leaflet-pane > canvas,
        .leaflet-zoom-box,
        .leaflet-image-layer,
        .leaflet-layer {
          z-index: 1;
        }
        .leaflet-overlay-pane {
          z-index: 2;
        }
        .leaflet-marker-pane {
          z-index: 3;
        }
        .leaflet-tooltip-pane {
          z-index: 4;
        }
        .leaflet-popup-pane {
          z-index: 5;
        }
        .leaflet-control {
          z-index: 6;
        }
      `;
      document.head.appendChild(style);

      mapInstanceRef.current = map;

      return () => {
        map.remove();
        mapInstanceRef.current = null;
        style.remove();
      };
    }
  }, []);

  // Handle nodes updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (nodes.length === 0) {
      map.setView(DEFAULT_CENTER, 13);
      return;
    }

    const bounds = L.latLngBounds([]);

    nodes.forEach((node) => {
      if (node.latest_position?.latitude && node.latest_position?.longitude) {
        const position: L.LatLngExpression = [node.latest_position.latitude, node.latest_position.longitude];

        const marker = L.marker(position, {
          icon: createNodeIcon(node.short_name || node.node_id_str.toString()),
        })
          .bindPopup(
            `
            <strong>Node: ${node.long_name || node.node_id_str}</strong><br>
            Battery: ${node.latest_device_metrics?.battery_level || 'Unknown'}%<br>
            Last Seen: ${node.last_heard?.toLocaleString() || 'Never'}
          `
          )
          .addTo(map);

        markersRef.current.push(marker);
        bounds.extend(position);
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
      });
    }
  }, [nodes]);

  return (
    <div
      ref={mapRef}
      style={{
        height: '100%',
        minHeight: '400px',
        position: 'relative',
        zIndex: 1,
      }}
      className="map-container"
    />
  );
}
