import { useState, useMemo } from 'react';
import { subHours, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useHeatmapEdges } from '@/hooks/api/useHeatmapEdges';
import { TracerouteHeatmapMap } from '@/components/traceroutes/TracerouteHeatmapMap';
import { RouteIcon } from 'lucide-react';

type TimeRange = '24h' | '7d' | 'custom';

export function TracerouteHeatmapPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [intensity, setIntensity] = useState(0.7);
  const [routeMetric] = useState<'success' | 'latency'>('success'); // Latency placeholder for Phase 2b

  const triggeredAtAfter = useMemo(() => {
    if (timeRange === '24h') return subHours(new Date(), 24);
    if (timeRange === '7d') return subDays(new Date(), 7);
    return undefined; // Custom would open a date picker
  }, [timeRange]);

  const { data, isLoading, error } = useHeatmapEdges({
    triggeredAtAfter,
  });

  const edges = data?.edges ?? [];
  const nodes = data?.nodes ?? [];
  const meta = data?.meta ?? { active_nodes_count: 0, total_trace_routes_count: 0 };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex items-center gap-2">
        <RouteIcon className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">Traceroute Heatmap</h1>
      </div>

      <div className="flex flex-1 min-h-0 gap-4">
        {/* Left panel */}
        <Card className="w-64 shrink-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Route Metric</Label>
              <Select value={routeMetric} onValueChange={() => {}}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="success">Success Count</SelectItem>
                  <SelectItem value="latency">Latency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Heatmap Intensity</Label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={intensity}
                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Map area */}
        <div className="relative flex-1 min-w-0">
          <Card className="h-full">
            <CardContent className="h-full p-0">
              {error && (
                <div className="flex h-full items-center justify-center text-destructive">
                  Failed to load heatmap: {error instanceof Error ? error.message : 'Unknown error'}
                </div>
              )}
              {isLoading && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Loading heatmap data...
                </div>
              )}
              {!error && !isLoading && <TracerouteHeatmapMap edges={edges} nodes={nodes} intensity={intensity} />}
            </CardContent>
          </Card>

          {/* Top-right stats and legend */}
          <div className="absolute right-4 top-4 z-10">
            <Card className="w-56">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Network Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>Active Nodes: {meta.active_nodes_count.toLocaleString()}</div>
                <div>Total Trace Routes: {meta.total_trace_routes_count.toLocaleString()}</div>
                <div className="pt-2">
                  <div className="mb-1 text-xs text-muted-foreground">Traffic</div>
                  <div
                    className="h-2 w-full rounded"
                    style={{
                      background: 'linear-gradient(to right, #3b82f6, #f97316, #ef4444)',
                    }}
                  />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>Low (Cool)</span>
                    <span>High (Hot)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
