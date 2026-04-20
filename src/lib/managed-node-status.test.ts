import { describe, expect, it } from 'vitest';

import {
  MANAGED_NODE_ONLINE_MAX_AGE_SECONDS,
  MANAGED_NODE_STALE_MAX_AGE_SECONDS,
  getManagedNodeStatusTier,
} from './managed-node-status';

describe('getManagedNodeStatusTier', () => {
  const now = new Date('2026-04-20T12:00:00Z');

  it('returns never when there is no ingestion timestamp', () => {
    expect(getManagedNodeStatusTier(null, now)).toBe('never');
    expect(getManagedNodeStatusTier(undefined, now)).toBe('never');
  });

  it('returns online at or below online threshold', () => {
    const onlineAtThreshold = new Date(now.getTime() - MANAGED_NODE_ONLINE_MAX_AGE_SECONDS * 1000);
    expect(getManagedNodeStatusTier(onlineAtThreshold, now)).toBe('online');
  });

  it('returns stale just above online threshold and at stale threshold', () => {
    const justAboveOnline = new Date(now.getTime() - (MANAGED_NODE_ONLINE_MAX_AGE_SECONDS + 1) * 1000);
    const staleAtThreshold = new Date(now.getTime() - MANAGED_NODE_STALE_MAX_AGE_SECONDS * 1000);
    expect(getManagedNodeStatusTier(justAboveOnline, now)).toBe('stale');
    expect(getManagedNodeStatusTier(staleAtThreshold, now)).toBe('stale');
  });

  it('returns offline above stale threshold', () => {
    const offline = new Date(now.getTime() - (MANAGED_NODE_STALE_MAX_AGE_SECONDS + 1) * 1000);
    expect(getManagedNodeStatusTier(offline, now)).toBe('offline');
  });
});
