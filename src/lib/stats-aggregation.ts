import { startOfDay } from 'date-fns';

export type AggregationWindow = 'hourly' | '6h' | 'daily';

/**
 * Determine aggregation window based on time range span.
 * - <= 2 days: hourly (no aggregation)
 * - > 2 days and <= 7 days: 6-hour windows
 * - > 7 days: daily (local midnight)
 */
export function getAggregationWindow(startDate: Date, endDate: Date): AggregationWindow {
  const spanHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  if (spanHours <= 48) return 'hourly';
  if (spanHours <= 168) return '6h';
  return 'daily';
}

/**
 * Get the bucket start (local midnight or 6h boundary) for a given date.
 * For 6h: 00:00, 06:00, 12:00, 18:00
 * For daily: 00:00 (start of day)
 */
export function getBucketStart(date: Date, window: '6h' | 'daily'): Date {
  const d = new Date(date);
  if (window === 'daily') {
    return startOfDay(d);
  }
  // 6h: floor hour to 0, 6, 12, 18
  const hours = d.getHours();
  const bucketHour = Math.floor(hours / 6) * 6;
  d.setHours(bucketHour, 0, 0, 0);
  return d;
}

export interface RawDataPoint {
  timestamp: number;
  value: number;
}

/**
 * Aggregate raw hourly data into larger windows.
 * - packet_volume: SUM (cumulative over window)
 * - online_nodes: AVERAGE (point-in-time counts)
 */
export function aggregateStats(
  points: RawDataPoint[],
  window: AggregationWindow,
  mode: 'sum' | 'average'
): RawDataPoint[] {
  if (window === 'hourly' || points.length === 0) return points;

  const bucketKey = (ts: number) => {
    const d = getBucketStart(new Date(ts), window === '6h' ? '6h' : 'daily');
    return d.getTime();
  };

  const buckets = new Map<number, { sum: number; count: number }>();
  for (const p of points) {
    const key = bucketKey(p.timestamp);
    const existing = buckets.get(key) ?? { sum: 0, count: 0 };
    existing.sum += p.value;
    existing.count += 1;
    buckets.set(key, existing);
  }

  return Array.from(buckets.entries())
    .map(([ts, { sum, count }]) => ({
      timestamp: ts,
      value: mode === 'sum' ? sum : sum / count,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}
