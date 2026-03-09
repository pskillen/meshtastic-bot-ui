import L from 'leaflet';
import * as turf from '@turf/turf';
import type { Feature, MultiPolygon, Point, Polygon } from 'geojson';

/** Role IDs from Meshtastic (matches InfrastructureNodeCard ROLE_LABELS). */
export const ROLE_COLORS: Record<number, string> = {
  2: '#2563eb', // ROUTER – blue
  3: '#16a34a', // ROUTER_CLIENT – green
  4: '#ea580c', // REPEATER – orange
  11: '#9333ea', // ROUTER_LATE – purple
  12: '#0d9488', // CLIENT_BASE – teal
};
const DEFAULT_ROLE_COLOR = '#64748b'; // Unknown / no role – slate

export function getRoleColor(role: number | null | undefined): string {
  return role != null && ROLE_COLORS[role] ? ROLE_COLORS[role] : DEFAULT_ROLE_COLOR;
}

/** Minimal node fields for popup content */
export interface NodePopupData {
  node_id: number;
  node_id_str?: string;
  long_name: string | null;
  short_name: string | null;
  /** Date or ISO string – API may return either; we normalize to locale format */
  last_heard?: Date | string | null;
  /** Constellation name when this is a managed node */
  constellationName?: string | null;
}

/**
 * Build HTML for a map marker popup.
 * Format: **Long name (short name)** / Last seen: ... / [Constellation: ...] / Open details link
 */
export function buildNodePopupHtml(node: NodePopupData): string {
  const displayName =
    node.long_name && node.short_name
      ? `${node.long_name} (${node.short_name})`
      : node.long_name || node.short_name || node.node_id_str || `Node ${node.node_id}`;
  const lastSeen = node.last_heard != null ? new Date(node.last_heard).toLocaleString() : 'Never';
  const detailsUrl = `/nodes/${node.node_id}`;
  const constellationLine =
    node.constellationName != null && node.constellationName !== ''
      ? `Constellation: ${escapeHtml(node.constellationName)}`
      : null;
  return `
  <strong>${escapeHtml(displayName)}</strong><br>
  Last seen: ${escapeHtml(lastSeen)}<br>
  ${constellationLine ? `<span style="color: #666;">${constellationLine}</span><br>` : ''}
  <a href="${detailsUrl}">Open details</a>
  `;
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

/**
 * Create a custom marker icon with bottom-centre anchor.
 * The teardrop tip aligns with the map point.
 * @param dimmed - When true, applies opacity 0.5 (for unselected nodes when one is selected)
 */
export function createNodeIcon(text: string, color: string, highlighted = false, dimmed = false): L.DivIcon {
  const highlightClass = highlighted ? ' marker-pin-highlighted' : '';
  const dimmedStyle = dimmed ? 'opacity: 0.5;' : '';
  return L.divIcon({
    className: 'custom-node-marker',
    html: `
      <div class="marker-container" style="${dimmedStyle}">
        <div class="marker-pin${highlightClass}" style="background: ${color};"></div>
        <span class="marker-text">${text}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

/**
 * Meshtastic precision_bits to approximate radius in meters.
 * Lower precision_bits = larger uncertainty (more obfuscation).
 * Source: https://meshtastic.org/docs/configuration/radio/channels/#position-precision
 *
 * Values 0–32: 0 = never send, 32 = full precision.
 * Documented range 10–19; 20–31 extrapolated (each bit halves uncertainty).
 */
export function precisionBitsToMeters(precisionBits: number | null | undefined): number | null {
  if (precisionBits == null) return null;
  if (precisionBits === 0) return null; // Location never sent
  if (precisionBits >= 32) return null; // Full precision, no uncertainty to draw

  // From Meshtastic docs: https://meshtastic.org/docs/configuration/radio/channels/
  // Bits 1–9 extrapolated (each bit halves uncertainty); 10–19 from official table
  const lookup: Record<number, number> = {
    1: 11930e3, // ~23.3 * 2^9 km
    2: 5965e3,
    3: 2982e3,
    4: 1491e3,
    5: 746e3,
    6: 373e3,
    7: 186e3,
    8: 93.2e3,
    9: 46.6e3,
    10: 23.3e3, // 23.3 km
    11: 11.7e3, // 11.7 km
    12: 5.8e3, // 5.8 km
    13: 2.9e3, // 2.9 km
    14: 1.5e3, // 1.5 km
    15: 729, // 729 m
    16: 364, // 364 m
    17: 182, // 182 m
    18: 91, // 91 m
    19: 45, // 45 m
    20: 22.5,
    21: 11.25,
    22: 5.6,
    23: 2.8,
    24: 1.4,
    25: 0.7,
    26: 0.35,
    27: 0.18,
    28: 0.09,
    29: 0.045,
    30: 0.02,
    31: 0.01,
  };
  const meters = lookup[precisionBits];
  return meters ?? (precisionBits <= 19 ? 45 : 0.01);
}

/**
 * Build a boundary polygon from points using buffered convex hull.
 */
export function boundaryPolygonFromPoints(
  points: Feature<Point>[],
  radiusKm: number
): Feature<Polygon> | Feature<MultiPolygon> | null {
  if (points.length === 0) return null;

  const bufferOpts = { units: 'kilometers' as const };

  if (points.length === 1) {
    return turf.buffer(points[0], radiusKm, bufferOpts) as Feature<Polygon>;
  }

  const fc = turf.featureCollection(points);
  const hull = turf.convex(fc) as Feature<Polygon> | undefined;
  if (!hull?.geometry || hull.geometry.type !== 'Polygon') {
    return turf.buffer(points[0], radiusKm, bufferOpts) as Feature<Polygon>;
  }
  return turf.buffer(hull, radiusKm, bufferOpts) as Feature<Polygon>;
}
