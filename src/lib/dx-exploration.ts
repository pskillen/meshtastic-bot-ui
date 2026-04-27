import { TRIGGER_TYPE_DX_WATCH, TRIGGER_TYPE_NEW_NODE_BASELINE } from '@/lib/traceroute-trigger-type';

const SKIP_REASON_LABELS: Record<string, string> = {
  '': '',
  no_eligible_source: 'No eligible source',
  source_queue_full: 'Source queue full',
  event_cooldown: 'Event cooldown',
  target_cooldown: 'Target cooldown',
  source_cooldown: 'Source cooldown',
  baseline_in_flight: 'Baseline in flight',
  baseline_recent_success: 'Recent baseline success',
  baseline_failure_cooldown: 'Baseline failure cooldown',
  duplicate_dx_watch: 'Duplicate DX watch',
  destination_excluded: 'Destination excluded',
  fanout_saturated: 'Fan-out saturated',
};

export function formatDxExplorationSkipReason(reason: string | undefined | null): string {
  if (!reason) return '';
  return SKIP_REASON_LABELS[reason] ?? reason.replace(/_/g, ' ');
}

export function buildDxTracerouteHistoryLink(params: {
  targetNodeId: number;
  sourceNodeId?: number | null;
  triggerFilter?: 'dx_watch' | 'new_node_baseline';
}): string {
  const sp = new URLSearchParams();
  sp.set('target_node', String(params.targetNodeId));
  if (params.sourceNodeId != null) {
    sp.set('source_node', String(params.sourceNodeId));
  }
  if (params.triggerFilter === 'dx_watch') {
    sp.set('trigger_type', String(TRIGGER_TYPE_DX_WATCH));
  }
  if (params.triggerFilter === 'new_node_baseline') {
    sp.set('trigger_type', String(TRIGGER_TYPE_NEW_NODE_BASELINE));
  }
  return `/traceroutes?${sp.toString()}`;
}
