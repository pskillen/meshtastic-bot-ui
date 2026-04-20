import { ManagedNodeStatusTier } from '@/lib/managed-node-status';

export type ManagedNodesSortKey =
  | 'status_asc'
  | 'status_desc'
  | 'name_asc'
  | 'name_desc'
  | 'last_packet_desc'
  | 'last_packet_asc'
  | 'packets_1h_desc'
  | 'packets_1h_asc'
  | 'packets_24h_desc'
  | 'packets_24h_asc'
  | 'radio_last_heard_desc'
  | 'radio_last_heard_asc'
  | 'owner_asc'
  | 'owner_desc';

export interface ManagedNodesUrlState {
  constellationIds: number[];
  statusTiers: ManagedNodeStatusTier[];
  ownerUsernames: string[];
  query: string;
  allowAutoTraceroute: boolean | null;
  sort: ManagedNodesSortKey;
}

export const DEFAULT_MANAGED_NODES_SORT: ManagedNodesSortKey = 'last_packet_desc';

const VALID_STATUS_TIERS = new Set<ManagedNodeStatusTier>(['online', 'stale', 'offline', 'never']);
const VALID_SORTS = new Set<ManagedNodesSortKey>([
  'status_asc',
  'status_desc',
  'name_asc',
  'name_desc',
  'last_packet_desc',
  'last_packet_asc',
  'packets_1h_desc',
  'packets_1h_asc',
  'packets_24h_desc',
  'packets_24h_asc',
  'radio_last_heard_desc',
  'radio_last_heard_asc',
  'owner_asc',
  'owner_desc',
]);

function parseCsv(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseManagedNodesUrlState(searchParams: URLSearchParams): ManagedNodesUrlState {
  const constellationIds = parseCsv(searchParams.get('constellation'))
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value));
  const statusTiers = parseCsv(searchParams.get('status')).filter((value): value is ManagedNodeStatusTier =>
    VALID_STATUS_TIERS.has(value as ManagedNodeStatusTier)
  );
  const ownerUsernames = parseCsv(searchParams.get('owner'));
  const query = searchParams.get('q')?.trim() ?? '';

  const allowAutoRaw = searchParams.get('auto_tr');
  const allowAutoTraceroute = allowAutoRaw === '1' ? true : allowAutoRaw === '0' ? false : null;

  const sortRaw = searchParams.get('sort');
  const sort = VALID_SORTS.has(sortRaw as ManagedNodesSortKey)
    ? (sortRaw as ManagedNodesSortKey)
    : DEFAULT_MANAGED_NODES_SORT;

  return {
    constellationIds,
    statusTiers,
    ownerUsernames,
    query,
    allowAutoTraceroute,
    sort,
  };
}

export function updateManagedNodesUrlState(
  searchParams: URLSearchParams,
  patch: Partial<ManagedNodesUrlState>
): URLSearchParams {
  const next = new URLSearchParams(searchParams);

  const setCsv = (key: string, values: string[]) => {
    if (values.length === 0) next.delete(key);
    else next.set(key, values.join(','));
  };

  if (patch.constellationIds) setCsv('constellation', patch.constellationIds.map(String));
  if (patch.statusTiers) setCsv('status', patch.statusTiers);
  if (patch.ownerUsernames) setCsv('owner', patch.ownerUsernames);
  if (patch.query !== undefined) {
    if (patch.query.trim()) next.set('q', patch.query.trim());
    else next.delete('q');
  }
  if (patch.allowAutoTraceroute !== undefined) {
    if (patch.allowAutoTraceroute == null) next.delete('auto_tr');
    else next.set('auto_tr', patch.allowAutoTraceroute ? '1' : '0');
  }
  if (patch.sort !== undefined) {
    if (patch.sort) next.set('sort', patch.sort);
    else next.delete('sort');
  }
  return next;
}
