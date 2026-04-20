export type ManagedNodeStatusTier = 'online' | 'stale' | 'offline' | 'never';

export const MANAGED_NODE_ONLINE_MAX_AGE_SECONDS = 600;
export const MANAGED_NODE_STALE_MAX_AGE_SECONDS = 3600;

const ONE_SECOND_MS = 1000;

export function getManagedNodeStatusTier(
  lastPacketIngestedAt: Date | string | null | undefined,
  now: Date = new Date()
): ManagedNodeStatusTier {
  if (!lastPacketIngestedAt) return 'never';

  const lastPacketDate = lastPacketIngestedAt instanceof Date ? lastPacketIngestedAt : new Date(lastPacketIngestedAt);
  const ageMs = Math.max(0, now.getTime() - lastPacketDate.getTime());
  const onlineCutoffMs = MANAGED_NODE_ONLINE_MAX_AGE_SECONDS * ONE_SECOND_MS;
  const staleCutoffMs = MANAGED_NODE_STALE_MAX_AGE_SECONDS * ONE_SECOND_MS;

  if (ageMs <= onlineCutoffMs) return 'online';
  if (ageMs <= staleCutoffMs) return 'stale';
  return 'offline';
}

export function managedNodeStatusTierColor(tier: ManagedNodeStatusTier): string {
  if (tier === 'online') return '#16a34a';
  if (tier === 'stale') return '#d97706';
  if (tier === 'offline') return '#dc2626';
  return '#64748b';
}
