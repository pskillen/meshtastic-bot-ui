import { useMemo } from 'react';
import { subHours } from 'date-fns';
import { ObservedNode } from '@/lib/models';
import { NodesAndConstellationsMap } from './NodesAndConstellationsMap';
import { LatestEnvironmentMetrics } from '@/lib/models';

const MAP_CUTOFF_HOURS = 24;

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

function getEnvironmentReportedTime(node: ObservedNode): Date | null {
  const env = node.latest_environment_metrics as LatestEnvironmentMetrics | null;
  if (!env?.reported_time) return null;
  return new Date(env.reported_time);
}

function formatWeatherLabel(env: LatestEnvironmentMetrics | null | undefined): string {
  if (!env) return '—';
  const parts: string[] = [];
  if (env.temperature != null) parts.push(`${env.temperature.toFixed(1)}°C`);
  // if (env.barometric_pressure != null) parts.push(`${Math.round(env.barometric_pressure)} hPa`);
  // if (env.relative_humidity != null) parts.push(`${Math.round(env.relative_humidity)}%`);
  return parts.length > 0 ? parts.join(' | ') : '—';
}

export interface WeatherNodesMapProps {
  nodes: ObservedNode[];
  /** Nodes with env reported after this are shown on map. Older are hidden. Default 24h. */
  cutoffHours?: number;
}

/**
 * Map of weather nodes with temp/pressure/RH labels and age-based grayscale fading.
 * Nodes with env readings > cutoffHours ago are hidden.
 */
export function WeatherNodesMap({ nodes, cutoffHours = MAP_CUTOFF_HOURS }: WeatherNodesMapProps) {
  const cutoff = useMemo(() => subHours(new Date(), cutoffHours), [cutoffHours]);

  const nodesForMap = useMemo(() => {
    return nodes.filter((node) => {
      if (!hasRecentLocation(node)) return false;
      const reported = getEnvironmentReportedTime(node);
      if (!reported) return false;
      return reported >= cutoff;
    });
  }, [nodes, cutoff]);

  const getMarkerLabel = useMemo(() => (node: ObservedNode) => formatWeatherLabel(node.latest_environment_metrics), []);

  const getMarkerGrayscale = useMemo(
    () => (node: ObservedNode) => {
      const reported = getEnvironmentReportedTime(node);
      if (!reported) return 1;
      const ageMs = Date.now() - reported.getTime();
      const ageHours = ageMs / (1000 * 60 * 60);
      if (ageHours >= MAP_CUTOFF_HOURS) return 1;
      return ageHours / MAP_CUTOFF_HOURS;
    },
    []
  );

  return (
    <NodesAndConstellationsMap
      observedNodes={nodesForMap}
      managedNodes={[]}
      showConstellation={false}
      showUnmanagedNodes={true}
      drawBoundingBox={false}
      drawPositionUncertainty={false}
      enableBubbles={true}
      getMarkerLabel={getMarkerLabel}
      getMarkerGrayscale={getMarkerGrayscale}
    />
  );
}
