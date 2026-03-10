import { ManagedNode } from '@/lib/models';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import * as d3 from 'd3';
import type { Feature, MultiPolygon, Point, Polygon, Position } from 'geojson';
import { getMapTileUrl, MAP_TILE_ATTRIBUTION } from '@/lib/map-tiles';
import { useMapTheme } from '@/hooks/useMapTheme';
import { createNodeIcon, boundaryPolygonFromPoints, buildNodePopupHtml } from './map-utils';

/** Radius (km) for constellation boundary polygon. */
const HULL_OFFSET_KM = 2.5;
/** Radius (km) for visible per-node dashed circles. */
const NODE_RADIUS_KM = 2;

interface ConstellationsMapProps {
  nodes: ManagedNode[];
}

// Default center only used if no nodes are present
const DEFAULT_CENTER: L.LatLngExpression = [55.8642, -4.2518];

export function ConstellationsMap({ nodes }: ConstellationsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polygonsRef = useRef<L.Polygon[]>([]);
  const isDark = useMapTheme();

  // Initialize the map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView(DEFAULT_CENTER, 13);

      const tileLayer = L.tileLayer(getMapTileUrl(isDark ?? false), {
        attribution: MAP_TILE_ATTRIBUTION,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

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
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -17.5px 0 0 -17.5px;
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
        tileLayerRef.current = null;
        style.remove();
      };
    }
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const oldLayer = tileLayerRef.current;
    if (map && oldLayer) {
      map.removeLayer(oldLayer);
      const newLayer = L.tileLayer(getMapTileUrl(isDark ?? false), {
        attribution: MAP_TILE_ATTRIBUTION,
      }).addTo(map);
      tileLayerRef.current = newLayer;
    }
  }, [isDark]);

  // Handle nodes updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers and polygons
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    polygonsRef.current.forEach((polygon) => polygon.remove());
    polygonsRef.current = [];

    if (nodes.length === 0) {
      map.setView(DEFAULT_CENTER, 13);
      return;
    }

    const bounds = L.latLngBounds([]);

    // Group nodes by constellation
    const constellations: Record<
      number,
      {
        name: string;
        color: string;
        nodes: ManagedNode[];
      }
    > = {};

    nodes.forEach((node) => {
      if (node.constellation) {
        const constellationId = node.constellation.id;
        if (!constellations[constellationId]) {
          constellations[constellationId] = {
            name: node.constellation.name || 'Unknown',
            color: node.constellation.map_color || '', // We'll assign color below
            nodes: [],
          };
        }
        constellations[constellationId].nodes.push(node);
      }
    });

    // Assign colors from d3.schemeCategory10 if not provided
    const constellationIds = Object.keys(constellations);
    constellationIds.forEach((id, idx) => {
      if (!constellations[+id].color) {
        constellations[+id].color = d3.schemeCategory10[idx % d3.schemeCategory10.length];
      }
    });

    // Pass 1: markers and per-node circles
    const boundariesToDraw: {
      boundary: Feature<Polygon> | Feature<MultiPolygon>;
      color: string;
      name: string;
    }[] = [];

    Object.values(constellations).forEach((constellation) => {
      const points: Feature<Point>[] = [];
      const positionedCount = constellation.nodes.filter((n) => n.position?.latitude && n.position?.longitude).length;
      const isSingleNode = positionedCount === 1;

      constellation.nodes.forEach((node) => {
        if (node.position?.latitude && node.position?.longitude) {
          const position: L.LatLngExpression = [node.position.latitude, node.position.longitude];

          const marker = L.marker(position, {
            icon: createNodeIcon(node.short_name || node.node_id_str.slice(4, 8), constellation.color, false),
          })
            .bindPopup(buildNodePopupHtml({ ...node, constellationName: constellation.name }))
            .addTo(map);
          markersRef.current.push(marker);
          bounds.extend(position);

          const point = turf.point([node.position.longitude, node.position.latitude]) as Feature<Point>;
          points.push(point);
          const bufPoly = turf.buffer(point, NODE_RADIUS_KM, { units: 'kilometers' }) as Feature<Polygon>;
          if (bufPoly && bufPoly.geometry) {
            const circleStyle = isSingleNode
              ? {
                  fillOpacity: 0.2,
                  weight: 4,
                  opacity: 0.9,
                  dashArray: '6 4',
                }
              : {
                  fillOpacity: 0.08,
                  weight: 2,
                  opacity: 0.5,
                  dashArray: '2 6',
                };
            const drawCircle = (coords: Position[]) => {
              const latlngs = coords
                .filter(
                  (c): c is [number, number] =>
                    Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && typeof c[1] === 'number'
                )
                .map(([lng, lat]) => [lat, lng]);
              if (latlngs.length > 2) {
                const circle = L.polygon(latlngs as [number, number][], {
                  color: constellation.color,
                  fillColor: constellation.color,
                  ...circleStyle,
                }).addTo(map);
                polygonsRef.current.push(circle);
              }
            };
            if (bufPoly.geometry.type === 'Polygon') {
              (bufPoly.geometry.coordinates as unknown as Position[][]).forEach(drawCircle);
            } else if (bufPoly.geometry.type === 'MultiPolygon') {
              (bufPoly.geometry.coordinates as unknown as Position[][][]).forEach((poly) => {
                poly.forEach(drawCircle);
              });
            }
          }
        }
      });

      // Only draw boundary for multi-node constellations (n>=2); for n=1 it would just duplicate the per-node circle at larger radius
      if (points.length >= 2) {
        const boundary = boundaryPolygonFromPoints(points, HULL_OFFSET_KM);
        if (boundary?.geometry) {
          boundariesToDraw.push({
            boundary,
            color: constellation.color,
            name: constellation.name,
          });
        }
      }
    });

    // Pass 2: draw boundary polygons on top so they're always visible
    boundariesToDraw.forEach(({ boundary, color, name }) => {
      const drawBoundary = (coords: Position[]) => {
        const latlngs = coords
          .filter(
            (c): c is [number, number] =>
              Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && typeof c[1] === 'number'
          )
          .map(([lng, lat]) => [lat, lng]);
        if (latlngs.length > 2) {
          const polygon = L.polygon(latlngs as [number, number][], {
            color,
            fillColor: color,
            fillOpacity: 0.12,
            weight: 3,
            opacity: 0.8,
            dashArray: '8 6',
          })
            .bindTooltip(`${name} boundary`)
            .addTo(map);
          polygonsRef.current.push(polygon);
        }
      };
      if (boundary.geometry.type === 'Polygon') {
        (boundary.geometry.coordinates as unknown as Position[][]).forEach(drawBoundary);
      } else if (boundary.geometry.type === 'MultiPolygon') {
        (boundary.geometry.coordinates as unknown as Position[][][]).forEach((polyArr) => {
          polyArr.forEach(drawBoundary);
        });
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
