import { useState } from 'react';
import { format } from 'date-fns';
import { subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTraceroutesWithWebSocket } from '@/hooks/useTraceroutesWithWebSocket';
import { useCanTriggerTraceroute, useTriggerTraceroute } from '@/hooks/api/useTraceroutes';
import { useManagedNodesSuspense, useNodesSuspense } from '@/hooks/api/useNodes';
import { TriggerTracerouteModal } from './TriggerTracerouteModal';
import { TracerouteDetailModal } from './TracerouteDetailModal';
import { AutoTraceRoute } from '@/lib/models';
import { RouteIcon, RotateCw } from 'lucide-react';

function routeSummary(tr: AutoTraceRoute): string {
  const route = tr.route;
  const routeBack = tr.route_back;
  if ((!route || route.length === 0) && (!routeBack || routeBack.length === 0)) return '—';
  const outStr = !route || route.length === 0 ? 'direct' : `${route.length} hops`;
  const backStr = !routeBack || routeBack.length === 0 ? 'direct' : `${routeBack.length} hops`;
  return `${outStr} out, ${backStr} back`;
}

function displayStatus(tr: AutoTraceRoute): string {
  if (tr.completed_at) return 'completed';
  return tr.status;
}

function StatusBadge({ status }: { status: string }) {
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

export function TracerouteHistory() {
  const [tabFilter, setTabFilter] = useState<'success' | 'all'>('success');
  const [sourceNodeId, setSourceNodeId] = useState<number | null>(null);
  const [targetNodeId, setTargetNodeId] = useState<number | null>(null);
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [triggerMode, setTriggerMode] = useState<'user' | 'auto'>('user');
  const [selectedTracerouteId, setSelectedTracerouteId] = useState<number | null>(null);

  const { data, isLoading, error } = useTraceroutesWithWebSocket({
    status: tabFilter === 'success' ? 'completed,pending,sent' : undefined,
    source_node: sourceNodeId ?? undefined,
    target_node: targetNodeId ?? undefined,
    page_size: 50,
  });
  const { data: canTriggerData } = useCanTriggerTraceroute();
  const canTrigger = canTriggerData?.can_trigger ?? false;
  const { managedNodes } = useManagedNodesSuspense(500);
  const tracerouteEligibleNodes = managedNodes.filter((n) => n.allow_auto_traceroute === true);
  const { nodes: observedNodes } = useNodesSuspense({
    lastHeardAfter: subDays(new Date(), 7),
    pageSize: 500,
  });
  const triggerMutation = useTriggerTraceroute();

  const handleOpenTrigger = (mode: 'user' | 'auto') => {
    setTriggerMode(mode);
    setTriggerModalOpen(true);
  };

  const traceroutes = data?.results ?? [];

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Traceroutes
          </CardTitle>
          {canTrigger && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleOpenTrigger('user')}>
                Trigger TR (target)
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleOpenTrigger('auto')}>
                Trigger TR (auto)
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <Button
              variant={tabFilter === 'success' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTabFilter('success')}
            >
              Success
            </Button>
            <Button variant={tabFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setTabFilter('all')}>
              All
            </Button>
            <Select
              value={sourceNodeId != null ? String(sourceNodeId) : 'all'}
              onValueChange={(v) => setSourceNodeId(v === 'all' ? null : parseInt(v, 10))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Source (sender)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {tracerouteEligibleNodes.map((n) => (
                  <SelectItem key={n.node_id} value={String(n.node_id)}>
                    {n.short_name ?? n.node_id_str ?? String(n.node_id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={targetNodeId != null ? String(targetNodeId) : 'all'}
              onValueChange={(v) => setTargetNodeId(v === 'all' ? null : parseInt(v, 10))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Target (recipient)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All targets</SelectItem>
                {observedNodes.map((n) => (
                  <SelectItem key={n.node_id} value={String(n.node_id)}>
                    {n.short_name ?? n.node_id_str ?? String(n.node_id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading && <div className="py-8 text-center text-muted-foreground">Loading...</div>}
          {error && (
            <div className="py-8 text-center text-destructive">
              Failed to load traceroutes: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          )}
          {!isLoading && !error && traceroutes.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">No traceroutes yet.</div>
          )}
          {!isLoading && !error && traceroutes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Triggered by</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Triggered</TableHead>
                  <TableHead>Completed</TableHead>
                  {canTrigger && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {traceroutes.map((tr) => (
                  <TableRow
                    key={tr.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTracerouteId(tr.id)}
                  >
                    <TableCell>{tr.source_node?.short_name ?? tr.source_node?.node_id_str ?? '—'}</TableCell>
                    <TableCell>{tr.target_node?.short_name ?? tr.target_node?.node_id_str ?? '—'}</TableCell>
                    <TableCell>{tr.trigger_type}</TableCell>
                    <TableCell>{tr.triggered_by_username ?? '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={displayStatus(tr)} />
                    </TableCell>
                    <TableCell className="max-w-[200px]" title={routeSummary(tr)}>
                      {routeSummary(tr)}
                    </TableCell>
                    <TableCell>{tr.triggered_at ? format(new Date(tr.triggered_at), 'PPp') : '—'}</TableCell>
                    <TableCell>{tr.completed_at ? format(new Date(tr.completed_at), 'PPp') : '—'}</TableCell>
                    {canTrigger && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            triggerMutation.mutate({
                              managedNodeId: tr.source_node.node_id,
                              targetNodeId: tr.target_node.node_id,
                            })
                          }
                          disabled={triggerMutation.isPending || tr.source_node.allow_auto_traceroute === false}
                          title="Repeat this traceroute"
                          aria-label="Repeat traceroute"
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TracerouteDetailModal
        tracerouteId={selectedTracerouteId}
        open={selectedTracerouteId != null}
        onOpenChange={(open) => !open && setSelectedTracerouteId(null)}
      />

      <TriggerTracerouteModal
        open={triggerModalOpen}
        onOpenChange={setTriggerModalOpen}
        mode={triggerMode}
        managedNodes={tracerouteEligibleNodes}
        observedNodes={observedNodes}
        onTrigger={async (managedNodeId, targetNodeId) => {
          await triggerMutation.mutateAsync({ managedNodeId, targetNodeId });
          setTriggerModalOpen(false);
        }}
        isSubmitting={triggerMutation.isPending}
      />
    </div>
  );
}
