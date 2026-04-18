import { subHours } from 'date-fns';
import { ObservedNode, LatestEnvironmentMetrics } from '@/lib/models';
import { computeWeatherTemperatureAnchors, WeatherTemperatureAnchors } from './map-utils';

function hasRecentLocation(node: ObservedNode): boolean {
  const pos = node.latest_position as {
    latitude?: number;
    longitude?: number;
    reported_time?: Date | string;
  } | null;
  if (!pos) return false;
  const lat = pos.latitude;
  const lon = pos.longitude;
  if (lat == null || lon == null || lat === 0 || lon === 0) return false;
  return true;
}

export function getEnvironmentReportedTime(node: ObservedNode): Date | null {
  const env = node.latest_environment_metrics as LatestEnvironmentMetrics | null;
  if (!env?.reported_time) return null;
  return new Date(env.reported_time);
}

/**
 * Filter a node set to those visible on the weather map: a usable position and
 * an env reading reported within `cutoffHours`.
 */
export function filterNodesForWeatherMap(
  nodes: ObservedNode[],
  cutoffHours: number,
  now: Date = new Date()
): ObservedNode[] {
  const cutoff = subHours(now, cutoffHours);
  return nodes.filter((node) => {
    if (!hasRecentLocation(node)) return false;
    const reported = getEnvironmentReportedTime(node);
    if (!reported) return false;
    return reported >= cutoff;
  });
}

/** Compute temperature anchors (5th/95th percentile) for the visible weather-map node set. */
export function computeVisibleWeatherTemperatureAnchors(
  nodes: ObservedNode[],
  cutoffHours: number,
  now: Date = new Date()
): WeatherTemperatureAnchors {
  const visible = filterNodesForWeatherMap(nodes, cutoffHours, now);
  return computeWeatherTemperatureAnchors(visible.map((n) => n.latest_environment_metrics?.temperature));
}
