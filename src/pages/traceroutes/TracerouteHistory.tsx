import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useTraceroutesInfiniteWithWebSocket } from '@/hooks/useTraceroutesWithWebSocket';
import { useTracerouteTriggerableNodesSuspense, useTriggerTraceroute } from '@/hooks/api/useTraceroutes';
import { useNodesSuspense } from '@/hooks/api/useNodes';
import { TriggerTracerouteModal, TriggerMode } from './TriggerTracerouteModal';
import { TracerouteDetailModal } from './TracerouteDetailModal';
import { getTracerouteErrorMessage } from './tracerouteErrors';
import { TracerouteStatsSection } from '@/components/traceroutes/TracerouteStatsSection';
import { AutoTraceRoute } from '@/lib/models';
import { useState } from 'react';
import { ChevronDown, RotateCw, RouteIcon, X } from 'lucide-react';

type StatusValue = 'completed' | 'failed' | 'pending' | 'sent';
const STATUS_OPTIONS: Array<{ value: StatusValue; label: string }> = [
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
];
const SUCCESS_STATUS_PRESET: StatusValue[] = ['completed', 'pending', 'sent'];

type TriggerTypeValue = 'auto' | 'user' | 'external' | 'monitor';
const TRIGGER_TYPE_OPTIONS: Array<{ value: TriggerTypeValue; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'user', label: 'User' },
  { value: 'external', label: 'External' },
  { value: 'monitor', label: 'Monitor' },
];

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

function parseCsvParam<T extends string>(raw: string | null): T[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as T[];
}

function parseNumberParam(raw: string | null): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function multiSelectLabel<T extends string>(
  values: T[],
  options: Array<{ value: T; label: string }>,
  fallback: string
): string {
  if (values.length === 0) return fallback;
  if (values.length === 1) {
    return options.find((o) => o.value === values[0])?.label ?? values[0];
  }
  return `${fallback} (${values.length})`;
}

export function TracerouteHistory() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Hydrate filters from URL search params (single source of truth).
  const sourceNodeId = parseNumberParam(searchParams.get('source_node'));
  const targetNodeId = parseNumberParam(searchParams.get('target_node'));
  const statusValues = parseCsvParam<StatusValue>(searchParams.get('status'));
  const triggerTypeValues = parseCsvParam<TriggerTypeValue>(searchParams.get('trigger_type'));

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    setSearchParams(next, { replace: true });
  };

  const setSourceNode = (id: number | null) => updateParams({ source_node: id?.toString() ?? null });
  const setTargetNode = (id: number | null) => updateParams({ target_node: id?.toString() ?? null });
  const setStatusValues = (values: StatusValue[]) => updateParams({ status: values.length ? values.join(',') : null });
  const setTriggerTypeValues = (values: TriggerTypeValue[]) =>
    updateParams({ trigger_type: values.length ? values.join(',') : null });

  const toggleValue = <T extends string>(current: T[], value: T): T[] =>
    current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

  const hasAnyFilter =
    sourceNodeId != null || targetNodeId != null || statusValues.length > 0 || triggerTypeValues.length > 0;

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('source_node');
    next.delete('target_node');
    next.delete('status');
    next.delete('trigger_type');
    setSearchParams(next, { replace: true });
  };

  // Successful preset = the status value set used by the old "Success" tab.
  const isSuccessPreset = useMemo(() => {
    if (statusValues.length !== SUCCESS_STATUS_PRESET.length) return false;
    return SUCCESS_STATUS_PRESET.every((s) => statusValues.includes(s));
  }, [statusValues]);

  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [selectedTracerouteId, setSelectedTracerouteId] = useState<number | null>(null);

  const queryParams = {
    source_node: sourceNodeId ?? undefined,
    target_node: targetNodeId ?? undefined,
    status: statusValues.length ? statusValues.join(',') : undefined,
    trigger_type: triggerTypeValues.length ? triggerTypeValues.join(',') : undefined,
    page_size: 50,
  };

  const { traceroutes, totalCount, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTraceroutesInfiniteWithWebSocket(queryParams);

  const { triggerableNodes } = useTracerouteTriggerableNodesSuspense();
  const canTrigger = triggerableNodes.length > 0;
  const { nodes: observedNodes } = useNodesSuspense({
    lastHeardAfter: subDays(new Date(), 7),
    pageSize: 500,
  });
  const triggerMutation = useTriggerTraceroute();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <RouteIcon className="h-6 w-6" />
          Traceroute history
        </h1>
        {canTrigger && (
          <Button size="default" onClick={() => setTriggerModalOpen(true)}>
            <RouteIcon className="mr-2 h-4 w-4" />
            Trigger traceroute
          </Button>
        )}
      </div>

      <TracerouteStatsSection />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Traceroutes
            {totalCount != null && <span className="text-sm text-muted-foreground font-normal">({totalCount})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <Button
              variant={isSuccessPreset ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusValues(isSuccessPreset ? [] : SUCCESS_STATUS_PRESET)}
              title="Show traceroutes that succeeded or are still in flight"
            >
              Success preset
            </Button>

            <Select
              value={sourceNodeId != null ? String(sourceNodeId) : 'all'}
              onValueChange={(v) => setSourceNode(v === 'all' ? null : parseInt(v, 10))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Source (sender)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {triggerableNodes.map((n) => (
                  <SelectItem key={n.node_id} value={String(n.node_id)}>
                    {n.short_name ?? n.node_id_str ?? String(n.node_id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={targetNodeId != null ? String(targetNodeId) : 'all'}
              onValueChange={(v) => setTargetNode(v === 'all' ? null : parseInt(v, 10))}
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-[160px] justify-between">
                  {multiSelectLabel(statusValues, STATUS_OPTIONS, 'Status')}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUS_OPTIONS.map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={opt.value}
                    checked={statusValues.includes(opt.value)}
                    onCheckedChange={() => setStatusValues(toggleValue(statusValues, opt.value))}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-[180px] justify-between">
                  {multiSelectLabel(triggerTypeValues, TRIGGER_TYPE_OPTIONS, 'Trigger type')}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Trigger type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {TRIGGER_TYPE_OPTIONS.map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={opt.value}
                    checked={triggerTypeValues.includes(opt.value)}
                    onCheckedChange={() => setTriggerTypeValues(toggleValue(triggerTypeValues, opt.value))}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasAnyFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters} title="Clear all filters">
                <X className="mr-1 h-4 w-4" />
                Clear filters
              </Button>
            )}
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
            <>
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
                        <StatusBadge status={tr.status} />
                      </TableCell>
                      <TableCell className="max-w-[200px]" title={routeSummary(tr)}>
                        {routeSummary(tr)}
                      </TableCell>
                      <TableCell>{tr.triggered_at ? format(new Date(tr.triggered_at), 'PPp') : '—'}</TableCell>
                      <TableCell>{tr.completed_at ? format(new Date(tr.completed_at), 'PPp') : '—'}</TableCell>
                      {canTrigger && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {triggerableNodes.some((n) => n.node_id === tr.source_node.node_id) ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                triggerMutation.mutate(
                                  {
                                    managedNodeId: tr.source_node.node_id,
                                    targetNodeId: tr.target_node.node_id,
                                  },
                                  {
                                    onError: (err) => {
                                      toast.error('Traceroute failed', {
                                        description: getTracerouteErrorMessage(err),
                                      });
                                    },
                                  }
                                )
                              }
                              disabled={triggerMutation.isPending || tr.source_node.allow_auto_traceroute === false}
                              title="Repeat this traceroute"
                              aria-label="Repeat traceroute"
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Loading…' : hasNextPage ? 'Load more' : 'No more results'}
                </Button>
              </div>
            </>
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
        mode={'user' as TriggerMode}
        managedNodes={triggerableNodes}
        observedNodes={observedNodes}
        onTrigger={async (managedNodeId, targetNodeId) => {
          try {
            await triggerMutation.mutateAsync({ managedNodeId, targetNodeId });
            setTriggerModalOpen(false);
          } catch (err) {
            toast.error('Traceroute failed', {
              description: getTracerouteErrorMessage(err),
            });
          }
        }}
        isSubmitting={triggerMutation.isPending}
      />
    </div>
  );
}
