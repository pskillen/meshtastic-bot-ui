import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { toast } from 'sonner';
import { ActivityIcon, RadioIcon } from 'lucide-react';
import { authService } from '@/lib/auth/authService';
import type { DxDestinationNode, DxEventListItem, DxManagedNodeMinimal, DxReasonCode } from '@/lib/models';
import {
  useDxActiveEventCount,
  useDxEventDetail,
  useDxEvents,
  useDxNodeExclusionMutation,
  useDxRecentEventCount,
} from '@/hooks/api/useDxMonitoring';
import type { DxEventsQueryParams } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const REASON_LABELS: Record<DxReasonCode, string> = {
  new_distant_node: 'New distant node',
  returned_dx_node: 'Returned DX node',
  distant_observation: 'Distant observation',
};

function formatReason(code: string): string {
  return REASON_LABELS[code as DxReasonCode] ?? code;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'PPp', { locale: enGB });
}

function httpStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'response' in err) {
    const r = (err as { response?: { status?: number } }).response;
    return r?.status;
  }
  return undefined;
}

/** Primary line is short/long name; Meshtastic id is secondary when names exist, else sole label. */
function formatDestinationLabel(dest: DxDestinationNode): { primary: string; idSecondary?: string } {
  const long = dest.long_name?.trim();
  const short = dest.short_name?.trim();
  let primary = '';
  if (long && short) {
    primary = long === short ? long : `${long} (${short})`;
  } else {
    primary = long || short || '';
  }
  if (!primary) {
    return { primary: dest.node_id_str };
  }
  return { primary, idSecondary: dest.node_id_str };
}

function formatObserverLabel(obs: DxManagedNodeMinimal): { primary: string; idSecondary?: string } {
  const name = obs.name?.trim();
  if (name) {
    return { primary: name, idSecondary: obs.node_id_str };
  }
  return { primary: obs.node_id_str };
}

function NodeLinkLabel({ to, primary, idSecondary }: { to: string; primary: string; idSecondary?: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <Link
        to={to}
        className="font-medium text-primary hover:underline truncate"
        title={idSecondary ? `${primary} · ${idSecondary}` : primary}
      >
        {primary}
      </Link>
      {idSecondary ? <span className="text-xs text-muted-foreground tabular-nums">{idSecondary}</span> : null}
    </div>
  );
}

export default function DxMonitoringPage() {
  const user = authService.getCurrentUser();
  const isStaff = Boolean(user?.is_staff);

  const [stateFilter, setStateFilter] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('');
  const [recentOnly, setRecentOnly] = useState(true);
  const [activeNow, setActiveNow] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const listParams: DxEventsQueryParams = useMemo(() => {
    const p: DxEventsQueryParams = { page, page_size: pageSize };
    if (stateFilter) p.state = stateFilter;
    if (reasonFilter) p.reason_code = reasonFilter;
    if (recentOnly) {
      p.recent_only = true;
      p.recent_days = 7;
    }
    if (activeNow) p.active_now = true;
    return p;
  }, [stateFilter, reasonFilter, recentOnly, activeNow, page, pageSize]);

  const listQuery = useDxEvents(listParams, isStaff);
  const activeCountQuery = useDxActiveEventCount(isStaff);
  const recentCountQuery = useDxRecentEventCount(isStaff, 7);

  const [detailId, setDetailId] = useState<string | null>(null);
  const detailQuery = useDxEventDetail(detailId, Boolean(detailId));

  const [excludeTarget, setExcludeTarget] = useState<DxEventListItem | null>(null);
  const [excludeNotes, setExcludeNotes] = useState('');
  const exclusionMutation = useDxNodeExclusionMutation();

  const openDetail = (row: DxEventListItem) => {
    setDetailId(row.id);
  };

  const closeDetail = () => {
    setDetailId(null);
  };

  const confirmExclude = () => {
    if (!excludeTarget) return;
    exclusionMutation.mutate(
      {
        node_id: excludeTarget.destination.node_id,
        exclude_from_detection: true,
        exclude_notes: excludeNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          const { primary } = formatDestinationLabel(excludeTarget.destination);
          toast.success(`Excluded ${primary} from DX detection`);
          setExcludeTarget(null);
          setExcludeNotes('');
        },
        onError: () => {
          toast.error('Could not update exclusion');
        },
      }
    );
  };

  if (!isStaff) {
    return (
      <div className="container mx-auto max-w-lg p-6">
        <Card>
          <CardHeader>
            <CardTitle>DX monitoring</CardTitle>
            <CardDescription>
              This dashboard is available to staff only. If you need access, contact a Meshflow administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const listErr = listQuery.isError ? httpStatus(listQuery.error) : undefined;
  const excludeDestLabel = excludeTarget ? formatDestinationLabel(excludeTarget.destination) : null;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <RadioIcon className="h-7 w-7" aria-hidden />
          DX monitoring
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detection events and evidence (read-only). Exclude noisy or mobile destinations from future DX detection when
          appropriate.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ActivityIcon className="h-4 w-4" />
              Active now
            </CardTitle>
            <CardDescription>State active and within active_until</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {activeCountQuery.isLoading ? '…' : (activeCountQuery.data ?? 0).toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Seen in last 7 days</CardTitle>
            <CardDescription>Any event with activity in the rolling window</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {recentCountQuery.isLoading ? '…' : (recentCountQuery.data ?? 0).toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Table page</CardTitle>
            <CardDescription>Matches filters below (not global totals)</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {listQuery.data?.count != null ? listQuery.data.count.toLocaleString() : '—'}
          </CardContent>
        </Card>
      </div>

      {listErr === 403 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Your account does not have permission to load DX events (staff required).
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 items-end">
          <div className="space-y-2 min-w-[140px]">
            <Label>State</Label>
            <Select
              value={stateFilter || '__all__'}
              onValueChange={(v) => {
                setStateFilter(v === '__all__' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Any</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[200px]">
            <Label>Reason</Label>
            <Select
              value={reasonFilter || '__all__'}
              onValueChange={(v) => {
                setReasonFilter(v === '__all__' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Any</SelectItem>
                <SelectItem value="new_distant_node">{REASON_LABELS.new_distant_node}</SelectItem>
                <SelectItem value="returned_dx_node">{REASON_LABELS.returned_dx_node}</SelectItem>
                <SelectItem value="distant_observation">{REASON_LABELS.distant_observation}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={recentOnly}
              onCheckedChange={(v) => {
                setRecentOnly(Boolean(v));
                setPage(1);
              }}
            />
            Last 7 days
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={activeNow}
              onCheckedChange={(v) => {
                setActiveNow(Boolean(v));
                setPage(1);
              }}
            />
            Active now
          </label>
        </CardContent>
      </Card>

      {listQuery.isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      )}

      {listQuery.isError && listErr !== 403 && (
        <div className="text-center py-12 rounded-lg border border-destructive/50 text-destructive">
          Could not load DX events.
        </div>
      )}

      {listQuery.isSuccess && (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Observer</TableHead>
                  <TableHead>First seen</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead className="text-right">Evidence</TableHead>
                  <TableHead className="text-right">Best km</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQuery.data.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      No events match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  listQuery.data.results.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">{formatReason(row.reason_code)}</TableCell>
                      <TableCell>
                        <Badge variant={row.state === 'active' ? 'default' : 'secondary'}>{row.state}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 max-w-[16rem]">
                          <NodeLinkLabel
                            to={`/nodes/${row.destination.node_id}`}
                            {...formatDestinationLabel(row.destination)}
                          />
                          {row.destination.dx_metadata.exclude_from_detection && (
                            <Badge variant="outline" className="w-fit text-xs">
                              Excluded from DX
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[12rem]">
                        {row.last_observer ? (
                          <NodeLinkLabel
                            to={`/nodes/${row.last_observer.node_id}`}
                            {...formatObserverLabel(row.last_observer)}
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{formatWhen(row.first_observed_at)}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{formatWhen(row.last_observed_at)}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.evidence_count}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.best_distance_km != null ? row.best_distance_km.toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        <Button variant="outline" size="sm" type="button" onClick={() => openDetail(row)}>
                          Detail
                        </Button>
                        {!row.destination.dx_metadata.exclude_from_detection && (
                          <Button variant="secondary" size="sm" type="button" onClick={() => setExcludeTarget(row)}>
                            Exclude
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
              <span>
                Page {page} · {listQuery.data.results.length} rows
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!listQuery.data.next}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(detailId)} onOpenChange={(o) => !o && closeDetail()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>DX event</DialogTitle>
            <DialogDescription>Evidence rows and destination metadata.</DialogDescription>
          </DialogHeader>
          {detailQuery.isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
          )}
          {detailQuery.isSuccess && detailQuery.data && (
            <div className="mt-2 space-y-4 text-sm">
              <div>
                <div className="text-muted-foreground">Reason</div>
                <div className="font-medium">{formatReason(detailQuery.data.reason_code)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Destination</div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <NodeLinkLabel
                    to={`/nodes/${detailQuery.data.destination.node_id}`}
                    {...formatDestinationLabel(detailQuery.data.destination)}
                  />
                  {detailQuery.data.destination.dx_metadata.exclude_from_detection && (
                    <Badge variant="outline">Excluded from DX</Badge>
                  )}
                </div>
              </div>
              {!detailQuery.data.destination.dx_metadata.exclude_from_detection && (
                <Button type="button" variant="secondary" size="sm" onClick={() => setExcludeTarget(detailQuery.data)}>
                  Exclude destination from DX detection…
                </Button>
              )}
              <div>
                <div className="text-muted-foreground mb-2">Observations</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Observer</TableHead>
                      <TableHead className="text-right">km</TableHead>
                      <TableHead>Raw packet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailQuery.data.observations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          No observations recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      detailQuery.data.observations.map((o) => {
                        const obsLabel = formatObserverLabel(o.observer);
                        return (
                          <TableRow key={o.id}>
                            <TableCell className="text-xs whitespace-nowrap">{formatWhen(o.observed_at)}</TableCell>
                            <TableCell className="text-xs max-w-[12rem]">
                              <NodeLinkLabel
                                to={`/nodes/${o.observer.node_id}`}
                                primary={obsLabel.primary}
                                idSecondary={obsLabel.idSecondary}
                              />
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {o.distance_km != null ? o.distance_km.toFixed(1) : '—'}
                            </TableCell>
                            <TableCell className="font-mono text-xs break-all">{o.raw_packet}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(excludeTarget)} onOpenChange={(o) => !o && setExcludeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exclude from DX detection?</DialogTitle>
            <DialogDescription>
              Future DX candidate detection will ignore{' '}
              {excludeDestLabel ? (
                <>
                  <span className="font-medium">{excludeDestLabel.primary}</span>
                  {excludeDestLabel.idSecondary ? (
                    <>
                      {' '}
                      (<span className="font-mono">{excludeDestLabel.idSecondary}</span>)
                    </>
                  ) : null}
                </>
              ) : null}
              . Use for known mobile or noisy stations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="dx-exclude-notes">Note (optional)</Label>
            <textarea
              id="dx-exclude-notes"
              value={excludeNotes}
              onChange={(e) => setExcludeNotes(e.target.value)}
              placeholder="e.g. vehicle gateway"
              rows={3}
              className={cn(
                'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm',
                'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setExcludeTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={exclusionMutation.isPending} onClick={confirmExclude}>
              {exclusionMutation.isPending ? 'Saving…' : 'Exclude node'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
