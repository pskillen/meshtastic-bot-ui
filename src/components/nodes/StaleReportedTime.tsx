import { format, formatDistanceToNow } from 'date-fns';
import { reportedTimeFreshness } from '@/lib/reported-time-stale';
import { cn } from '@/lib/utils';

type StaleReportedTimeProps = {
  at: Date | string | number | null | undefined;
  /** When `at` is null/undefined/invalid */
  fallback?: string;
  className?: string;
};

/**
 * Relative time ("x ago") with yellow border if over 24h old, red if over 7 days.
 * `title` shows absolute local time for hover/accessibility.
 */
export function StaleReportedTime({ at, fallback = '—', className }: StaleReportedTimeProps) {
  if (at == null) {
    return <span className={className}>{fallback}</span>;
  }

  const d = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(d.getTime())) {
    return <span className={className}>{fallback}</span>;
  }

  const relative = formatDistanceToNow(d, { addSuffix: true });
  const title = format(d, 'PPpp');
  const freshness = reportedTimeFreshness(d);

  const staleClasses =
    freshness === 'stale24h'
      ? 'border border-yellow-500/70 bg-yellow-500/10 text-yellow-900 dark:border-yellow-500/60 dark:bg-yellow-500/15 dark:text-yellow-100'
      : freshness === 'stale7d'
        ? 'border border-red-500/70 bg-red-500/10 text-red-900 dark:border-red-500/60 dark:bg-red-500/15 dark:text-red-100'
        : null;

  return (
    <time
      dateTime={d.toISOString()}
      title={title}
      className={cn(staleClasses && 'inline-block rounded px-1.5 py-0.5', staleClasses, className)}
    >
      {relative}
    </time>
  );
}
