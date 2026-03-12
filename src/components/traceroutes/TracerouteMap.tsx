import { AutoTraceRoute, TracerouteRouteNode } from '@/lib/models';
import { useMapTileUrl } from '@/hooks/useMapTileUrl';
import { createNodeIcon } from '@/components/nodes/map-utils';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-arrowheads';

const DEFAULT_CENTER: L.LatLngExpression = [55.8642, -4.2518];
const SOURCE_COLOR = '#2563eb';
const TARGET_COLOR = '#16a34a';
const INTERMEDIATE_COLOR = '#64748b';
const UNKNOWN_NODE_ID = 0xffffffff;

type LatLng = [number, number];

function getSourcePos(tr: AutoTraceRoute): LatLng | null {
  const pos = tr.source_node?.position;
  if (pos?.latitude != null && pos?.longitude != null) {
    return [pos.latitude, pos.longitude];
  }
  return null;
}

function getTargetPos(tr: AutoTraceRoute): LatLng | null {
  const pos = tr.target_node?.latest_position;
  if (pos?.latitude != null && pos?.longitude != null) {
    return [pos.latitude, pos.longitude];
  }
  return null;
}

interface Segment {
  latlngs: LatLng[];
  dashed: boolean;
  unknownLabels: { node_id_str: string }[];
}

function buildSegments(startPos: LatLng | null, nodes: TracerouteRouteNode[], endPos: LatLng | null): Segment[] {
  if (!startPos || !endPos) return [];
  const segments: Segment[] = [];
  let solidRun: LatLng[] = [startPos];
  let pendingUnknowns: { node_id_str: string }[] = [];

  for (const node of nodes) {
    if (node.position) {
      const pos: LatLng = [node.position.latitude, node.position.longitude];
      if (pendingUnknowns.length > 0) {
        segments.push({
          latlngs: [solidRun[solidRun.length - 1], pos],
          dashed: true,
          unknownLabels: pendingUnknowns,
        });
        pendingUnknowns = [];
      }
      solidRun.push(pos);
    } else {
      if (solidRun.length >= 2) {
        segments.push({ latlngs: [...solidRun], dashed: false, unknownLabels: [] });
      }
      solidRun = [solidRun[solidRun.length - 1]];
      pendingUnknowns.push({ node_id_str: node.node_id_str });
    }
  }

  if (pendingUnknowns.length > 0) {
    segments.push({
      latlngs: [solidRun[solidRun.length - 1], endPos],
      dashed: true,
      unknownLabels: pendingUnknowns,
    });
  } else {
    solidRun.push(endPos);
    segments.push({ latlngs: solidRun, dashed: false, unknownLabels: [] });
  }

  return segments;
}

function midpoint(a: LatLng, b: LatLng): LatLng {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export function TracerouteMap({ traceroute }: { traceroute: AutoTraceRoute }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layersRef = useRef<L.Layer[]>([]);
  const { url: tileUrl, attribution } = useMapTileUrl();

  const sourcePos = getSourcePos(traceroute);
  const targetPos = getTargetPos(traceroute);
  const routeNodes = traceroute.route_nodes ?? [];
  const routeBackNodes = traceroute.route_back_nodes ?? [];

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView(DEFAULT_CENTER, 13);
      const tileLayer = L.tileLayer(tileUrl, { attribution }).addTo(map);
      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      const style = document.createElement('style');
      style.id = 'traceroute-map-styles';
      style.textContent = `
        /* Ensure overlay/marker panes stay above tiles (Dialog transform can break Leaflet defaults) */
        .map-container .leaflet-tile-pane { z-index: 1; }
        .map-container .leaflet-overlay-pane { z-index: 400; }
        .map-container .leaflet-marker-pane { z-index: 600; }
        .map-container .leaflet-tooltip-pane { z-index: 650; }
        .custom-node-marker { background: transparent; border: none; }
        .marker-container { position: relative; text-align: center; }
        .marker-pin {
          width: 35px; height: 35px; border-radius: 50% 50% 50% 0;
          position: absolute; transform: rotate(-45deg);
          left: 50%; top: 50%; margin: -17.5px 0 0 -17.5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .marker-text {
          position: absolute; width: 40px; left: 60%; transform: translateX(-50%);
          top: -5px; text-align: center; color: white; font-weight: bold; font-size: 12px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        .traceroute-unknown-label { font-size: 11px; font-family: monospace; background: rgba(255,255,255,0.9); border: 1px dashed #999; padding: 2px 6px; }
      `;
      document.head.appendChild(style);

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
      const newLayer = L.tileLayer(tileUrl, { attribution }).addTo(map);
      tileLayerRef.current = newLayer;
    }
  }, [tileUrl, attribution]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    layersRef.current.forEach((layer) => layer.remove());
    layersRef.current = [];

    const bounds = L.latLngBounds([]);

    if (!sourcePos || !targetPos) {
      return;
    }

    const sourceLabel = traceroute.source_node?.short_name ?? traceroute.source_node?.node_id_str ?? 'S';
    const targetLabel = traceroute.target_node?.short_name ?? traceroute.target_node?.node_id_str ?? 'T';

    const sourceMarker = L.marker(sourcePos, {
      icon: createNodeIcon(sourceLabel, SOURCE_COLOR, false),
    }).addTo(map);
    layersRef.current.push(sourceMarker);
    bounds.extend(sourcePos);

    const targetMarker = L.marker(targetPos, {
      icon: createNodeIcon(targetLabel, TARGET_COLOR, false),
    }).addTo(map);
    layersRef.current.push(targetMarker);
    bounds.extend(targetPos);

    const outboundSegments = buildSegments(sourcePos, routeNodes, targetPos);
    const returnSegments = buildSegments(targetPos, routeBackNodes, sourcePos);

    outboundSegments.forEach((seg) => {
      const poly = L.polyline(seg.latlngs, {
        color: SOURCE_COLOR,
        weight: 4,
        dashArray: seg.dashed ? '10, 10' : undefined,
        className: 'traceroute-outbound',
      }).addTo(map);
      poly.arrowheads({ size: '12px', frequency: 'endonly' });
      layersRef.current.push(poly);

      seg.latlngs.forEach((p) => bounds.extend(p));

      if (seg.dashed && seg.unknownLabels.length > 0 && seg.latlngs.length >= 2) {
        const mid = midpoint(seg.latlngs[0], seg.latlngs[seg.latlngs.length - 1]);
        seg.unknownLabels.forEach((label) => {
          const tooltip = L.tooltip({
            permanent: true,
            direction: 'center',
            className: 'traceroute-unknown-label',
          })
            .setContent(label.node_id_str)
            .setLatLng(mid);
          tooltip.addTo(map);
          layersRef.current.push(tooltip);
        });
      }
    });

    returnSegments.forEach((seg) => {
      const poly = L.polyline(seg.latlngs, {
        color: TARGET_COLOR,
        weight: 4,
        dashArray: seg.dashed ? '10, 10' : undefined,
        className: 'traceroute-return',
      }).addTo(map);
      poly.arrowheads({ size: '12px', frequency: 'endonly' });
      layersRef.current.push(poly);

      seg.latlngs.forEach((p) => bounds.extend(p));

      if (seg.dashed && seg.unknownLabels.length > 0 && seg.latlngs.length >= 2) {
        const mid = midpoint(seg.latlngs[0], seg.latlngs[seg.latlngs.length - 1]);
        seg.unknownLabels.forEach((label) => {
          const tooltip = L.tooltip({
            permanent: true,
            direction: 'center',
            className: 'traceroute-unknown-label',
          })
            .setContent(label.node_id_str)
            .setLatLng(mid);
          tooltip.addTo(map);
          layersRef.current.push(tooltip);
        });
      }
    });

    const intermediateByNodeId = new Map<number, { pos: LatLng; label: string }>();
    for (const node of [...routeNodes, ...routeBackNodes]) {
      if (node.position && node.node_id !== UNKNOWN_NODE_ID && !intermediateByNodeId.has(node.node_id)) {
        intermediateByNodeId.set(node.node_id, {
          pos: [node.position.latitude, node.position.longitude],
          label: node.short_name ?? node.node_id_str,
        });
      }
    }
    intermediateByNodeId.forEach(({ pos, label }) => {
      const marker = L.marker(pos, {
        icon: createNodeIcon(label, INTERMEDIATE_COLOR, false),
      }).addTo(map);
      layersRef.current.push(marker);
      bounds.extend(pos);
    });

    if (bounds.isValid()) {
      // Invalidate size first (map in Dialog may have wrong dimensions until visible)
      map.invalidateSize();
      // Defer fitBounds to avoid race with marker rendering; run after layout settles
      const t = setTimeout(() => {
        if (mapInstanceRef.current !== map) return;
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        // Refresh after zoom completes (fixes markers disappearing in modal)
        map.once('moveend', () => map.invalidateSize());
      }, 50);
      return () => clearTimeout(t);
    }
  }, [traceroute, sourcePos, targetPos, routeNodes, routeBackNodes]);

  if (!sourcePos || !targetPos) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border bg-muted/30 text-muted-foreground">
        Position data unavailable for source or target
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ height: '100%', minHeight: '400px', position: 'relative', zIndex: 1 }}
      className="map-container"
    />
  );
}
