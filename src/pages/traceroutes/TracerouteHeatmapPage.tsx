import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { subHours, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHeatmapEdges } from '@/hooks/api/useHeatmapEdges';
import { TracerouteHeatmapMap } from '@/components/traceroutes/TracerouteHeatmapMap';
import { RouteIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimeRange = '24h' | '7d' | '30d' | 'custom';
export type EdgeMetric = 'packets' | 'snr';

function NetworkStatsCard({
  meta,
  className,
}: {
  meta: { active_nodes_count: number; total_trace_routes_count: number };
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
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const triggeredAtAfter = useMemo(() => {
    if (timeRange === '24h') return subHours(new Date(), 24);
    if (timeRange === '7d') return subDays(new Date(), 7);
    if (timeRange === '30d') return subDays(new Date(), 30);
    return undefined; // Custom would open a date picker
  }, [timeRange]);

  const { data, isLoading, error } = useHeatmapEdges({
    triggeredAtAfter,
    edgeMetric,
  });

  const edges = data?.edges ?? [];
  const nodes = data?.nodes ?? [];
  const meta = data?.meta ?? { active_nodes_count: 0, total_trace_routes_count: 0 };

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
        </div>
      </div>

      {/* Stats: below top bar on mobile, overlay on desktop */}
      <div className="block md:hidden">
        <NetworkStatsCard meta={meta} />
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
            {!error && !isLoading && <TracerouteHeatmapMap edges={edges} nodes={nodes} edgeMetric={edgeMetric} />}
          </CardContent>
        </Card>

        {/* Stats overlay on desktop */}
        <div className="absolute right-4 top-4 z-10 hidden md:block">
          <NetworkStatsCard meta={meta} className="w-56" />
        </div>
      </div>
    </div>
  );
}
