import { Navigate, useLocation } from 'react-router-dom';
import { TracerouteStatsPage } from '@/pages/traceroutes/TracerouteStatsPage';

/**
 * Query keys that imply the traceroute *history* table (legacy /traceroutes?… bookmarks).
 * `source_node` is intentionally omitted: it scopes the stats page at `/traceroutes` and must not redirect.
 */
const HISTORY_QUERY_KEYS = new Set(['target_node', 'status', 'trigger_type', 'strategy']);

function searchLooksLikeHistoryFilters(search: string): boolean {
  const qs = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  for (const key of qs.keys()) {
    if (HISTORY_QUERY_KEYS.has(key)) return true;
  }
  return false;
}

/**
 * `/traceroutes` root: stats landing, unless the URL carries history-table filter params
 * (`target_node`, `status`, `trigger_type`, `strategy`); then redirect to `/traceroutes/history`.
 */
export function TraceroutesLanding() {
  const { search } = useLocation();
  if (search && searchLooksLikeHistoryFilters(search)) {
    return <Navigate to={{ pathname: '/traceroutes/history', search }} replace />;
  }
  return <TracerouteStatsPage />;
}
