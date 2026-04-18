import {
  WEATHER_MARKER_STALE_HEX,
  WEATHER_TEMP_COLD_HEX,
  WEATHER_TEMP_HOT_HEX,
  WeatherTemperatureAnchors,
} from './map-utils';

export interface WeatherMapLegendProps {
  /** Must match `WeatherNodesMap` cutoff (hours until markers are hidden / fully bordered). */
  fadeHours?: number;
  /** Live temperature anchors from the visible weather-map nodes (5th / 95th percentile). */
  temperatureAnchors?: WeatherTemperatureAnchors;
}

function formatTemp(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'n/a';
  return `${value.toFixed(1)}°C`;
}

function formatMidTemp(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null || max == null || !Number.isFinite(min) || !Number.isFinite(max)) return 'n/a';
  return `${((min + max) / 2).toFixed(1)}°C`;
}

/**
 * Two-row legend for the Weather map:
 *   Row 1 — temperature gradient (cold blue → hot red) anchored on visible p5 / p95.
 *   Row 2 — border colour gradient (transparent → slate) representing reading age.
 *
 * Component name kept as `WeatherMapAgeLegend` for backward compatibility; it now
 * conveys both temperature and age.
 */
export function WeatherMapAgeLegend({ fadeHours = 24, temperatureAnchors }: WeatherMapLegendProps) {
  const { minC = null, maxC = null } = temperatureAnchors ?? {};
  const degenerate = minC == null || maxC == null || Math.abs(maxC - minC) < 0.001;
  const tempLabel = degenerate
    ? 'Marker fill colour: not enough temperature variance to colour by temperature'
    : `Marker fill colour: cold (${formatTemp(minC)}) on the left, hot (${formatTemp(maxC)}) on the right`;
  const ageLabel = `Marker border colour: fresh on the left, fully stale by ${fadeHours} hours on the right`;

  return (
    <div className="mb-3 space-y-3">
      <div>
        <div
          className="h-2.5 w-full rounded-full border border-border/70 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          style={{
            background: degenerate
              ? undefined
              : `linear-gradient(to right, ${WEATHER_TEMP_COLD_HEX}, ${WEATHER_TEMP_HOT_HEX})`,
          }}
          role="img"
          aria-label={tempLabel}
        />
        <div className="mt-1.5 flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
          <span>{formatTemp(minC)}</span>
          <span>{formatMidTemp(minC, maxC)}</span>
          <span>{formatTemp(maxC)}</span>
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">Fill colour: cold → hot temperature</div>
      </div>
      <div>
        <div
          className="h-2.5 w-full rounded-full border border-border/70 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          style={{
            background: `linear-gradient(to right, transparent, ${WEATHER_MARKER_STALE_HEX})`,
          }}
          role="img"
          aria-label={ageLabel}
        />
        <div className="mt-1.5 flex justify-between gap-2 text-xs text-muted-foreground">
          <span>Fresh</span>
          <span className="tabular-nums">{fadeHours}h</span>
          <span>Stale</span>
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">Border colour: reading age</div>
      </div>
    </div>
  );
}
