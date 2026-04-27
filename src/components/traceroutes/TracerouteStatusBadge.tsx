import { Badge } from '@/components/ui/badge';
import type { AutoTraceRoute } from '@/lib/models';
import { tracerouteStatusLabel } from '@/lib/traceroute-status';

export function TracerouteStatusBadge({ status }: { status: AutoTraceRoute['status'] }) {
  const variant =
    status === 'completed'
      ? 'default'
      : status === 'failed'
        ? 'destructive'
        : status === 'pending' || status === 'sent'
          ? 'secondary'
          : 'outline';
  return <Badge variant={variant}>{tracerouteStatusLabel(status)}</Badge>;
}
