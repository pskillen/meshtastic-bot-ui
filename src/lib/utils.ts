import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { intervalToDuration } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a Meshtastic ID (integer form) to hex representation (!abcdef12)
 */
export function meshtasticIdToHex(meshtasticId: number): string {
  const BROADCAST_ID = 0xffffffff;

  if (meshtasticId === BROADCAST_ID) {
    return '^all';
  }

  return `!${meshtasticId.toString(16).padStart(8, '0')}`;
}

const UPTIME_UNITS: { key: keyof ReturnType<typeof intervalToDuration>; singular: string; plural: string }[] = [
  { key: 'years', singular: 'year', plural: 'years' },
  { key: 'months', singular: 'month', plural: 'months' },
  { key: 'weeks', singular: 'week', plural: 'weeks' },
  { key: 'days', singular: 'day', plural: 'days' },
  { key: 'hours', singular: 'hour', plural: 'hours' },
  { key: 'minutes', singular: 'minute', plural: 'minutes' },
  { key: 'seconds', singular: 'second', plural: 'seconds' },
];

/**
 * Format uptime in seconds as a friendly string (e.g. "2 years 3 months", "5 days 12 hours").
 * Shows the 2 most significant non-zero units.
 */
export function formatUptimeSeconds(seconds: number): string {
  const duration = intervalToDuration({
    start: new Date(0),
    end: new Date(seconds * 1000),
  });

  const parts: string[] = [];
  for (const { key, singular, plural } of UPTIME_UNITS) {
    const val = duration[key] ?? 0;
    if (val > 0 && parts.length < 2) {
      parts.push(`${val} ${val === 1 ? singular : plural}`);
    }
  }

  return parts.length > 0 ? parts.join(' ') : '0 seconds';
}

/**
 * Wall-clock duration between two instants, using the same unit rules as {@link formatUptimeSeconds}
 * (e.g. "1 minute 30 seconds").
 */
export function formatElapsedBetween(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms < 0) return '—';
  return formatUptimeSeconds(Math.floor(ms / 1000));
}
