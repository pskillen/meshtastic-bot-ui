import { formatDistanceToNow } from 'date-fns';

/** Relative "x ago" for tooltips and non-React callers; mirrors StaleReportedTime friendly text. */
export function formatRecencyRelative(at: Date | string | number | null | undefined, fallback = '—'): string {
  if (at == null) return fallback;
  const d = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(d.getTime())) return fallback;
  return formatDistanceToNow(d, { addSuffix: true });
}
