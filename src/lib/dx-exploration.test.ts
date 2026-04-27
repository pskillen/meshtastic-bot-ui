import { describe, it, expect } from 'vitest';
import { buildDxTracerouteHistoryLink, formatDxExplorationSkipReason } from '@/lib/dx-exploration';
import { TRIGGER_TYPE_DX_WATCH, TRIGGER_TYPE_NEW_NODE_BASELINE } from '@/lib/traceroute-trigger-type';

describe('dx-exploration', () => {
  it('formats known skip reasons', () => {
    expect(formatDxExplorationSkipReason('no_eligible_source')).toBe('No eligible source');
    expect(formatDxExplorationSkipReason('unknown_reason_code')).toBe('unknown reason code');
  });

  it('builds traceroute history links with optional source and trigger filter', () => {
    expect(buildDxTracerouteHistoryLink({ targetNodeId: 99, sourceNodeId: 1, triggerFilter: 'dx_watch' })).toBe(
      `/traceroutes?target_node=99&source_node=1&trigger_type=${TRIGGER_TYPE_DX_WATCH}`
    );
    expect(buildDxTracerouteHistoryLink({ targetNodeId: 99, triggerFilter: 'new_node_baseline' })).toBe(
      `/traceroutes?target_node=99&trigger_type=${TRIGGER_TYPE_NEW_NODE_BASELINE}`
    );
    expect(buildDxTracerouteHistoryLink({ targetNodeId: 42 })).toBe('/traceroutes?target_node=42');
  });
});
