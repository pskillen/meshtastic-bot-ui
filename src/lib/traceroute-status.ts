import type { AutoTraceRoute } from '@/lib/models';

export type TracerouteApiStatus = AutoTraceRoute['status'];

/** User-facing label; API still uses pending/sent/completed/failed. */
export function tracerouteStatusLabel(status: TracerouteApiStatus): string {
  switch (status) {
    case 'pending':
      return 'Queued';
    case 'sent':
      return 'In flight';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}
