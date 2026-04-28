import { useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { subHours, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHeatmapEdges } from '@/hooks/api/useHeatmapEdges';
import { useManagedNodesSuspense } from '@/hooks/api/useNodes';
import { TracerouteHeatmapMap } from '@/components/traceroutes/TracerouteHeatmapMap';
import { RouteIcon, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRACEROUTE_STRATEGIES, type TracerouteStrategyValue } from '@/lib/traceroute-strategy';

type TimeRange = '24h' | '7d' | '30d' | 'custom';
export type EdgeMetric = 'packets' | 'snr';

/** Client-side stale styling threshold (hours without mesh observation). */
const HEATMAP_STALE_THRESHOLD_HOURS = 6;

function parseCsvParam<T extends string>(raw: string | null): T[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as T[];
}

function parseSourceParam(raw: string | null): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

const HEATMAP_STRATEGY_OPTIONS: Array<{ value: TracerouteStrategyValue; label: string }> = TRACEROUTE_STRATEGIES.filter(
  (v) => v !== 'legacy'
).map((value) => ({
  value,
  label:
    value === 'intra_zone'
      ? 'Intra-zone'
      : value === 'dx_across'
        ? 'DX across'
        : value === 'dx_same_side'
          ? 'DX same side'
          : value,
}));

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

function toggleValue<T extends string>(current: T[], value: T): T[] {
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

function NetworkStatsCard({
  meta,
  staleThresholdHours,
  className,
}: {
  meta: { active_nodes_count: number; total_trace_routes_count: number };
  staleThresholdHours: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Network Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>Active Nodes: {meta.active_nodes_count.toLocaleString()}</div>
        <div>Total Trace Routes: {meta.total_trace_routes_count.toLocaleString()}</div>
        <div className="border-t border-border pt-2">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Nodes (topology)</div>
          <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
            <li>Dot size — centrality (backbone paths)</li>
            <li>Fill hue — degree (cool → warm)</li>
            <li>Ring weight — degree + backbone role (also for colour-blind contrast)</li>
            <li>Opacity — mesh recency (older than {staleThresholdHours}h fades; API role “offline” from ~24h)</li>
          </ul>
        </div>
        <div className="pt-2">
          <div className="mb-1 text-xs text-muted-foreground">Packets: Quiet → Busy</div>
          <div
            className="h-2 w-full rounded"
            style={{
              background: 'linear-gradient(to right, #3b82f6, #f97316)',
            }}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>Quiet (blue)</span>
            <span>Busy (orange)</span>
          </div>
          <div className="mb-1 mt-2 text-xs text-muted-foreground">Link quality: Unhealthy → Healthy</div>
          <div
            className="h-2 w-full rounded"
            style={{
              background: 'linear-gradient(to right, #ef4444, #22c55e)',
            }}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>Unhealthy (red)</span>
            <span>Healthy (green)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TracerouteHeatmapPage({ edgeMetric }: { edgeMetric: EdgeMetric }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const strategyTokens = parseCsvParam<TracerouteStrategyValue>(searchParams.get('strategy'));
  const sourceMeshId = parseSourceParam(searchParams.get('source'));

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === '') next.delete(key);
        else next.set(key, value);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const triggeredAtAfter = useMemo(() => {
    if (timeRange === '24h') return subHours(new Date(), 24);
    if (timeRange === '7d') return subDays(new Date(), 7);
    if (timeRange === '30d') return subDays(new Date(), 30);
    return undefined; // Custom would open a date picker
  }, [timeRange]);

  const { managedNodes } = useManagedNodesSuspense({ pageSize: 500 });

  const { data, isLoading, error } = useHeatmapEdges({
    triggeredAtAfter,
    edgeMetric,
    sourceNodeId: sourceMeshId ?? undefined,
    targetStrategy: strategyTokens.length ? strategyTokens.join(',') : undefined,
  });

  const edges = data?.edges ?? [];
  const nodes = data?.nodes ?? [];
  const meta = data?.meta ?? { active_nodes_count: 0, total_trace_routes_count: 0 };

  const hasGeoFilters = strategyTokens.length > 0 || sourceMeshId != null;

  return (
    <div className="flex min-h-[50vh] flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
      {/* Top bar: title + time range picker + node labels */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <RouteIcon className="h-6 w-6" />
          <h1 className="text-xl font-semibold sm:text-2xl">Traceroute Heatmap</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4" data-testid="heatmap-filters">
          <div className="flex rounded-md border border-input bg-muted/50 p-0.5">
            <Link
              to="/traceroutes/map/heat"
              className={cn(
                'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                edgeMetric === 'packets'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Packets
            </Link>
            <Link
              to="/traceroutes/map/snr"
              className={cn(
                'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                edgeMetric === 'snr'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Link quality (SNR)
            </Link>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[180px]">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select
            value={sourceMeshId != null ? String(sourceMeshId) : 'all'}
            onValueChange={(v) => updateParams({ source: v === 'all' ? null : v })}
          >
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="heatmap-source-select">
              <SelectValue placeholder="Source feeder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {managedNodes.map((n) => (
                <SelectItem key={n.node_id} value={String(n.node_id)}>
                  {n.short_name ?? n.node_id_str ?? String(n.node_id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-[180px] justify-between" type="button">
                {multiSelectLabel(strategyTokens, HEATMAP_STRATEGY_OPTIONS, 'Strategy')}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Strategy</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {HEATMAP_STRATEGY_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={strategyTokens.includes(opt.value)}
                  onCheckedChange={() =>
                    updateParams({
                      strategy: toggleValue(strategyTokens, opt.value).join(',') || null,
                    })
                  }
                  onSelect={(e) => e.preventDefault()}
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasGeoFilters && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => updateParams({ strategy: null, source: null })}
              data-testid="heatmap-clear-geo-filters"
            >
              <X className="mr-1 h-4 w-4" />
              Clear geo filters
            </Button>
          )}
        </div>
      </div>

      {/* Stats: below top bar on mobile, overlay on desktop */}
      <div className="block md:hidden">
        <NetworkStatsCard meta={meta} staleThresholdHours={HEATMAP_STALE_THRESHOLD_HOURS} />
      </div>

      {/* Map area */}
      <div className="relative flex-1 min-h-[300px] md:min-h-[calc(100dvh-16rem)]" data-testid="heatmap-map">
        <Card className="h-full min-h-[300px]">
          <CardContent className="h-full p-0">
            {error && (
              <div className="flex h-full min-h-[300px] items-center justify-center text-destructive">
                Failed to load heatmap: {error instanceof Error ? error.message : 'Unknown error'}
              </div>
            )}
            {isLoading && (
              <div className="flex h-full min-h-[300px] items-center justify-center text-muted-foreground">
                Loading heatmap data...
              </div>
            )}
            {!error && !isLoading && (
              <TracerouteHeatmapMap
                edges={edges}
                nodes={nodes}
                edgeMetric={edgeMetric}
                staleThresholdHours={HEATMAP_STALE_THRESHOLD_HOURS}
              />
            )}
          </CardContent>
        </Card>

        {/* Stats overlay on desktop */}
        <div className="absolute right-4 top-4 z-10 hidden md:block">
          <NetworkStatsCard meta={meta} staleThresholdHours={HEATMAP_STALE_THRESHOLD_HOURS} className="w-64" />
        </div>
      </div>
    </div>
  );
}
