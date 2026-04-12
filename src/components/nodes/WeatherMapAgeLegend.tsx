import { WEATHER_MARKER_FRESH_HEX, WEATHER_MARKER_STALE_HEX } from './map-utils';

export interface WeatherMapAgeLegendProps {
  /** Must match `WeatherNodesMap` cutoff (hours until markers are hidden / fully gray). */
  fadeHours?: number;
}

export function WeatherMapAgeLegend({ fadeHours = 24 }: WeatherMapAgeLegendProps) {
  const label = `Marker colour: fresh env reading on the left, fading to gray by ${fadeHours} hours on the right`;

  return (
    <div className="mb-3">
      <div
        className="h-2.5 w-full rounded-full border border-border/70 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
        style={{
          background: `linear-gradient(to right, ${WEATHER_MARKER_FRESH_HEX}, ${WEATHER_MARKER_STALE_HEX})`,
        }}
        role="img"
        aria-label={label}
      />
      <div className="mt-1.5 flex justify-between gap-2 text-xs text-muted-foreground">
        <span>Fresh</span>
        <span className="tabular-nums">{fadeHours}h</span>
        <span>Stale</span>
      </div>
    </div>
  );
}
