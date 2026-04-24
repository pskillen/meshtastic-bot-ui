const HOUR_MS = 60 * 60 * 1000;

export type ReportedTimeFreshness = 'fresh' | 'stale24h' | 'stale7d';

export type ReportedTimeFreshnessOptions = {
  /** Age at or past this many hours → warning (yellow). Default 24. */
  warningAfterHours?: number;
  /** Age at or past this many hours → danger (red). Must be greater than warning; default 168 (7d). */
  dangerAfterHours?: number;
};

const DEFAULT_WARNING_HOURS = 24;
const DEFAULT_DANGER_HOURS = 168;

function normalizeThresholdHours(warningH: number, dangerH: number): { warningH: number; dangerH: number } {
  const w = Number.isFinite(warningH) && warningH > 0 ? warningH : DEFAULT_WARNING_HOURS;
  let d = Number.isFinite(dangerH) && dangerH > 0 ? dangerH : DEFAULT_DANGER_HOURS;
  if (d <= w) {
    if (import.meta.env.DEV) {
      console.warn(
        `[reportedTimeFreshness] dangerAfterHours (${dangerH}) must be > warningAfterHours (${warningH}); using ${w + 1}`
      );
    }
    d = w + 1;
  }
  return { warningH: w, dangerH: d };
}

/**
 * Mesh "report recency" bands for UI emphasis.
 *
 * Uses **inclusive** age thresholds: at exactly `warningAfterHours` old, returns `stale24h`;
 * at exactly `dangerAfterHours`, returns `stale7d` (danger wins over warning).
 */
export function reportedTimeFreshness(
  at: Date | string | number,
  options?: ReportedTimeFreshnessOptions
): ReportedTimeFreshness | null {
  const d = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(d.getTime())) return null;

  const { warningH, dangerH } = normalizeThresholdHours(
    options?.warningAfterHours ?? DEFAULT_WARNING_HOURS,
    options?.dangerAfterHours ?? DEFAULT_DANGER_HOURS
  );
  const warningMs = warningH * HOUR_MS;
  const dangerMs = dangerH * HOUR_MS;

  const ageMs = Date.now() - d.getTime();
  if (ageMs <= 0) return 'fresh';
  if (ageMs >= dangerMs) return 'stale7d';
  if (ageMs >= warningMs) return 'stale24h';
  return 'fresh';
}
