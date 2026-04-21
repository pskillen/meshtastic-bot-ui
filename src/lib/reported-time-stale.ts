const DAY_MS = 86_400_000;

export type ReportedTimeFreshness = 'fresh' | 'stale24h' | 'stale7d';

/** Stale if strictly over 24h (yellow) or over 7 days (red). */
export function reportedTimeFreshness(at: Date | string | number): ReportedTimeFreshness | null {
  const d = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(d.getTime())) return null;
  const ageMs = Date.now() - d.getTime();
  if (ageMs <= 0) return 'fresh';
  if (ageMs > 7 * DAY_MS) return 'stale7d';
  if (ageMs > DAY_MS) return 'stale24h';
  return 'fresh';
}
