import type { AutoTraceRoute } from '@/lib/models';
import { formatElapsedBetween } from '@/lib/utils';
import { TRIGGER_TYPE_EXTERNAL } from '@/lib/traceroute-trigger-type';

/**
 * Elapsed duration from triggered to completion, matching {@link TracerouteHistory}.
 */
export function TracerouteElapsedCell({ tr }: { tr: AutoTraceRoute }) {
  if (tr.status === 'failed') return '—';
  /** Only completion time is reliable for externally ingested traceroutes */
  if (tr.trigger_type === TRIGGER_TYPE_EXTERNAL) {
    return (
      <span
        className="text-muted-foreground"
        title="External traceroutes do not record when the probe started; elapsed time cannot be computed."
      >
        Unknown
      </span>
    );
  }
  if (!tr.triggered_at || !tr.completed_at) return '—';
  return formatElapsedBetween(new Date(tr.triggered_at), new Date(tr.completed_at));
}
