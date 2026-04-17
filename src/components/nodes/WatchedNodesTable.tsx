import type { ReactNode } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { AutoTraceRoute, NodeWatch, ObservedNode, PaginatedResponse } from '@/lib/models';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MeshWatchControls } from '@/components/nodes/MeshWatchControls';
import { useMeshtasticApi } from '@/hooks/api/useApi';
import { BatteryIcon } from 'lucide-react';

const LATEST_TRACEROUTES = 5;

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Primary: relative (e.g. "1 hour ago"). Secondary: absolute timestamp. */
function FriendlyThenAbsolute({ value }: { value: Date | string | null | undefined }) {
  const d = toDate(value);
  if (!d) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div>
      <div className="text-sm">{formatDistanceToNow(d, { addSuffix: true })}</div>
      <div className="text-xs text-muted-foreground tabular-nums mt-0.5">{format(d, 'PPpp')}</div>
    </div>
  );
}

function routeSummary(tr: AutoTraceRoute): string {
  const route = tr.route;
  const routeBack = tr.route_back;
  const outEmpty = !route || route.length === 0;
  const backEmpty = !routeBack || routeBack.length === 0;
  if (outEmpty && backEmpty) {
    return tr.status === 'completed' ? 'Direct' : '—';
  }
  const outStr = outEmpty ? 'Direct' : `${route.length} hops`;
  const backStr = backEmpty ? 'Direct' : `${routeBack.length} hops`;
  return `${outStr} out, ${backStr} back`;
}

function TrStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'completed'
      ? 'default'
      : status === 'failed'
        ? 'destructive'
        : status === 'pending' || status === 'sent'
          ? 'secondary'
          : 'outline';
  return <Badge variant={variant}>{status}</Badge>;
}

function WatchTracerouteHistoryRows({
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
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-muted-foreground text-sm py-6">
          Loading traceroutes…
        </TableCell>
      </TableRow>
    );
  }
  if (isError) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-muted-foreground text-sm py-6">
          Could not load traceroutes.
        </TableCell>
      </TableRow>
    );
  }
  const rows: AutoTraceRoute[] = data?.results ?? [];
  if (rows.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-muted-foreground text-sm py-6">
          No traceroutes to this node yet.
        </TableCell>
      </TableRow>
    );
  }
  return (
    <>
      {rows.map((tr) => (
        <TableRow key={tr.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onOpenTraceroute(tr.id)}>
          <TableCell>{tr.source_node?.short_name ?? tr.source_node?.node_id_str ?? '—'}</TableCell>
          <TableCell>{tr.trigger_type}</TableCell>
          <TableCell>
            <TrStatusBadge status={tr.status} />
          </TableCell>
          <TableCell className="max-w-[200px]" title={routeSummary(tr)}>
            {routeSummary(tr)}
          </TableCell>
          <TableCell>
            <FriendlyThenAbsolute value={tr.triggered_at} />
          </TableCell>
        </TableRow>
      ))}
    </>
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

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground mb-1.5">{children}</p>;
}

function BatteryBlock({ node }: { node: ObservedNode }) {
  const m = node.latest_device_metrics;
  if (!m) {
    return <span className="text-muted-foreground">—</span>;
  }
  const batteryLevel = m.battery_level != null ? Number(m.battery_level) : null;
  let batteryColor = 'text-red-500';
  if (batteryLevel != null) {
    if (batteryLevel > 70) {
      batteryColor = 'text-green-500';
    } else if (batteryLevel > 30) {
      batteryColor = 'text-yellow-500';
    }
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <BatteryIcon className={`h-4 w-4 shrink-0 ${batteryColor}`} aria-hidden />
        <span className="text-sm tabular-nums">
          {batteryLevel != null ? `${Math.round(batteryLevel)}%` : '—'}
          {m.voltage != null && ` · ${Number(m.voltage).toFixed(2)} V`}
        </span>
      </div>
      {m.reported_time && (
        <div>
          <FieldLabel>Metrics reported</FieldLabel>
          <FriendlyThenAbsolute value={m.reported_time} />
        </div>
      )}
    </div>
  );
}

export function WatchedNodesTable({ watches, watchesQuery, onOpenTraceroute }: WatchedNodesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Watched nodes</CardTitle>
        <CardDescription>
          Mesh monitoring watches for your account. Each block is one watched node.{' '}
          <Link to="/traceroutes" className="text-teal-600 dark:text-teal-400 hover:underline">
            Open full traceroute history
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <div className="p-4 flex flex-col gap-4">
        {watches.map((watch) => {
          const node = observedAsNode(watch);
          return (
            <div
              key={watch.id}
              className="rounded-lg border-2 border-slate-300 bg-card text-card-foreground shadow-sm dark:border-slate-400 p-4 space-y-4"
            >
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <FieldLabel>Node</FieldLabel>
                  <Link
                    to={`/nodes/${node.node_id}`}
                    className="font-medium text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    {node.short_name || node.node_id_str}
                  </Link>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{node.node_id_str}</div>
                </div>
                <div>
                  <FieldLabel>Last heard</FieldLabel>
                  {node.last_heard ? (
                    <FriendlyThenAbsolute value={node.last_heard} />
                  ) : (
                    <span className="text-muted-foreground text-sm">Never</span>
                  )}
                </div>
                <div>
                  <FieldLabel>Battery</FieldLabel>
                  <BatteryBlock node={node} />
                </div>
                <div>
                  <FieldLabel>Watch</FieldLabel>
                  <MeshWatchControls
                    node={node}
                    watch={watch}
                    watchesQuery={watchesQuery}
                    idPrefix={`watch-dash-${watch.id}`}
                    compact
                  />
                </div>
              </div>

              <div className="border-t border-slate-300 pt-4 dark:border-slate-500">
                <FieldLabel>Latest traceroutes (this target)</FieldLabel>
                <div className="rounded-md border border-slate-300 overflow-x-auto dark:border-slate-500">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>TR sender</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Triggered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <WatchTracerouteHistoryRows targetNodeId={node.node_id} onOpenTraceroute={onOpenTraceroute} />
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
