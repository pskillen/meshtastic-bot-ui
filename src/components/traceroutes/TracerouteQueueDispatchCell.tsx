import { format, formatDistanceToNow } from 'date-fns';
import type { AutoTraceRoute } from '@/lib/models';

function parseIso(s: string | null | undefined): Date | null {
  if (s == null || s === '') return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Relative queue/dispatch timing for pending and sent traceroutes; em dash otherwise. */
export function TracerouteQueueDispatchCell({ tr }: { tr: AutoTraceRoute }) {
  if (tr.status === 'pending') {
    const d = parseIso(tr.earliest_send_at);
    if (!d) {
      return (
        <span className="text-muted-foreground" title="Due time not available from API">
          —
        </span>
      );
    }
    return <span title={`Due ${format(d, 'PPpp')}`}>Due {formatDistanceToNow(d, { addSuffix: true })}</span>;
  }
  if (tr.status === 'sent') {
    const d = parseIso(tr.dispatched_at);
    if (!d) {
      return (
        <span className="text-muted-foreground" title="Legacy row: command dispatch time was not recorded">
          —
        </span>
      );
    }
    return (
      <span title={`Sent to source ${format(d, 'PPpp')}`}>Sent {formatDistanceToNow(d, { addSuffix: true })}</span>
    );
  }
  return <span className="text-muted-foreground">—</span>;
}
