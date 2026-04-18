import { useMemo } from 'react';
import { ObservedNode, LatestEnvironmentMetrics } from '@/lib/models';
import { NodesAndConstellationsMap } from './NodesAndConstellationsMap';
import {
  WeatherTemperatureAnchors,
  computeWeatherTemperatureAnchors,
  temperatureColor,
  weatherBorderColor,
  WEATHER_TEMP_NEUTRAL_COLOR,
} from './map-utils';
import { filterNodesForWeatherMap, getEnvironmentReportedTime } from './weather-map-helpers';

const MAP_CUTOFF_HOURS = 24;

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
  /**
   * Optional pre-computed temperature anchors (e.g. lifted to a parent so the legend
   * shows matching min/max). When omitted, anchors are derived from the visible nodes.
   */
  temperatureAnchors?: WeatherTemperatureAnchors;
}

/**
 * Map of weather nodes. Marker fill is the node's latest temperature mapped onto a
 * cold-blue → hot-red gradient anchored on the visible 5th/95th percentile. The 3px
 * inset border fades from transparent (fresh) to slate (stale) over `cutoffHours`.
 */
export function WeatherNodesMap({ nodes, cutoffHours = MAP_CUTOFF_HOURS, temperatureAnchors }: WeatherNodesMapProps) {
  const nodesForMap = useMemo(() => filterNodesForWeatherMap(nodes, cutoffHours), [nodes, cutoffHours]);

  const anchors = useMemo<WeatherTemperatureAnchors>(() => {
    if (temperatureAnchors) return temperatureAnchors;
    return computeWeatherTemperatureAnchors(nodesForMap.map((n) => n.latest_environment_metrics?.temperature));
  }, [temperatureAnchors, nodesForMap]);

  const getMarkerLabel = useMemo(() => (node: ObservedNode) => formatWeatherLabel(node.latest_environment_metrics), []);

  const getMarkerColor = useMemo(
    () => (node: ObservedNode) => {
      const temp = node.latest_environment_metrics?.temperature;
      if (temp == null) return WEATHER_TEMP_NEUTRAL_COLOR;
      return temperatureColor(temp, anchors.minC, anchors.maxC);
    },
    [anchors]
  );

  const getMarkerBorderColor = useMemo(
    () => (node: ObservedNode) => weatherBorderColor(getEnvironmentReportedTime(node), cutoffHours),
    [cutoffHours]
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
      getMarkerColor={getMarkerColor}
      getMarkerBorderColor={getMarkerBorderColor}
    />
  );
}
