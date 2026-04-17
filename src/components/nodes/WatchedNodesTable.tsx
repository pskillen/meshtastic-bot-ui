import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { AutoTraceRoute, NodeWatch, ObservedNode, PaginatedResponse } from '@/lib/models';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MeshWatchControls } from '@/components/nodes/MeshWatchControls';
import { useMeshtasticApi } from '@/hooks/api/useApi';
import { RouteIcon } from 'lucide-react';

const LATEST_TRACEROUTES = 5;

function WatchRowTraceroutes({
  targetNodeId,
  onOpenTraceroute,
}: {
  targetNodeId: number;
  onOpenTraceroute: (id: number) => void;
}) {
  const api = useMeshtasticApi();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['traceroutes', 'watches-dashboard', targetNodeId],
    queryFn: () => api.getTraceroutes({ target_node: targetNodeId, page_size: LATEST_TRACEROUTES }),
  });

  if (isLoading) {
    return <span className="text-muted-foreground text-xs">Loading…</span>;
  }
  if (isError) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  const rows: AutoTraceRoute[] = data?.results ?? [];
  if (rows.length === 0) {
    return <span className="text-muted-foreground text-xs">None yet</span>;
  }
  return (
    <ul className="space-y-1 text-xs max-w-[220px]">
      {rows.map((tr) => (
        <li key={tr.id}>
          <button
            type="button"
            className="text-left text-teal-600 dark:text-teal-400 hover:underline"
            onClick={() => onOpenTraceroute(tr.id)}
          >
            {tr.triggered_at ? format(new Date(tr.triggered_at), 'MMM d HH:mm') : '—'} · {tr.status}
          </button>
        </li>
      ))}
    </ul>
  );
}

export interface WatchedNodesTableProps {
  watches: NodeWatch[];
  watchesQuery: Pick<UseQueryResult<PaginatedResponse<NodeWatch>>, 'isLoading' | 'isError'>;
  onOpenTraceroute: (id: number) => void;
}

function observedAsNode(watch: NodeWatch): ObservedNode {
  return watch.observed_node as unknown as ObservedNode;
}

export function WatchedNodesTable({ watches, watchesQuery, onOpenTraceroute }: WatchedNodesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Watched nodes</CardTitle>
        <CardDescription>Mesh monitoring watches for your account. Manage alerts from each row.</CardDescription>
      </CardHeader>
      <div className="p-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Node</TableHead>
              <TableHead>Last heard</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1">
                  <RouteIcon className="h-3.5 w-3.5" aria-hidden />
                  Latest traceroutes
                </span>
              </TableHead>
              <TableHead>Watch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {watches.map((watch) => {
              const node = observedAsNode(watch);
              const lh = node.last_heard;
              return (
                <TableRow key={watch.id}>
                  <TableCell>
                    <div>
                      <Link
                        to={`/nodes/${node.node_id}`}
                        className="font-medium text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {node.short_name || node.node_id_str}
                      </Link>
                      <div className="text-xs text-muted-foreground">{node.node_id_str}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{lh ? lh.toLocaleString() : 'Never'}</TableCell>
                  <TableCell>
                    <WatchRowTraceroutes targetNodeId={node.node_id} onOpenTraceroute={onOpenTraceroute} />
                  </TableCell>
                  <TableCell>
                    <MeshWatchControls
                      node={node}
                      watch={watch}
                      watchesQuery={watchesQuery}
                      idPrefix={`watch-dash-${watch.id}`}
                      compact
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
