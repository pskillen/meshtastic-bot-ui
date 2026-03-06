import { useMemo, useState, Suspense } from 'react';
import { subDays, subHours } from 'date-fns';
import { useInfrastructureNodesSuspense } from '@/hooks/api/useNodes';
import { InfrastructureNodeCard } from '@/components/nodes/InfrastructureNodeCard';
import { NodesMap } from '@/components/nodes/NodesMap';
import { MonitoredNodesBatteryChart } from '@/components/nodes/MonitoredNodesBatteryChart';
import { MonitoredNodesChannelUtilChart } from '@/components/nodes/MonitoredNodesChannelUtilChart';
import { TimeRangeSelect } from '@/components/TimeRangeSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ObservedNode } from '@/lib/models';
import { MapPinOff } from 'lucide-react';

const CHART_TIME_RANGE_OPTIONS = [
  { key: '24h', label: '24 hours' },
  { key: '48h', label: '48 hours' },
  { key: '1d', label: 'Today' },
  { key: '2d', label: '2 days' },
  { key: '7d', label: '7 days' },
  { key: '14d', label: '14 days' },
];

type NodeListTimeRange = '2h' | '24h' | '7d' | '30d' | 'all';

const TIME_RANGE_OPTIONS: { value: NodeListTimeRange; label: string }[] = [
  { value: '2h', label: '2 hours' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
];

function getLastHeardAfter(timeRange: NodeListTimeRange): Date | undefined {
  if (timeRange === 'all') return undefined;
  const now = new Date();
  switch (timeRange) {
    case '2h':
      return subHours(now, 2);
    case '24h':
      return subHours(now, 24);
    case '7d':
      return subDays(now, 7);
    case '30d':
      return subDays(now, 30);
    default:
      return subDays(now, 7);
  }
}

function hasLocation(node: ObservedNode): boolean {
  const pos = node.latest_position as { latitude?: number; longitude?: number } | null;
  if (!pos) return false;
  const lat = pos.latitude;
  const lon = pos.longitude;
  return lat != null && lon != null && lat !== 0 && lon !== 0;
}

function MeshInfrastructureContent() {
  const [timeRange, setTimeRange] = useState<NodeListTimeRange>('7d');
  const [includeClientBase, setIncludeClientBase] = useState(false);
  const [chartTimeRangeLabel, setChartTimeRangeLabel] = useState('48h');
  const [chartDateRange, setChartDateRange] = useState<{ startDate: Date; endDate: Date }>({
    startDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  const lastHeardAfter = useMemo(() => getLastHeardAfter(timeRange), [timeRange]);

  const { nodes, totalNodes, fetchNextPage, hasNextPage } = useInfrastructureNodesSuspense({
    lastHeardAfter,
    pageSize: 100,
    includeClientBase,
  });

  const nodesWithLocation = useMemo(() => nodes.filter(hasLocation), [nodes]);
  const nodesWithoutLocation = useMemo(() => nodes.filter((n) => !hasLocation(n)), [nodes]);

  const sortedNodes = useMemo(
    () =>
      [...nodes].sort((a, b) => {
        if (!a.last_heard) return 1;
        if (!b.last_heard) return -1;
        return b.last_heard.getTime() - a.last_heard.getTime();
      }),
    [nodes]
  );

  const handleChartTimeRangeChange = (value: string, timeRange: { startDate: Date; endDate: Date }) => {
    setChartTimeRangeLabel(value);
    setChartDateRange(timeRange);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Mesh Infrastructure</h1>
        <div className="mt-2 flex items-center gap-2">
          <Switch id="include-client-base" checked={includeClientBase} onCheckedChange={setIncludeClientBase} />
          <Label htmlFor="include-client-base">Include CLIENT_BASE</Label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <label htmlFor="time-range" className="text-sm text-muted-foreground">
            Node list time range:
          </label>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as NodeListTimeRange)}>
            <SelectTrigger className="w-[180px]" id="time-range" aria-label="Select time range">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure Node Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <NodesMap nodes={nodesWithLocation} />
          </CardContent>
        </Card>
      </div>

      {nodesWithoutLocation.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinOff className="h-5 w-5" />
              Nodes without location
            </CardTitle>
            <CardDescription>
              Infrastructure nodes that do not publish location ({nodesWithoutLocation.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nodesWithoutLocation.map((node) => (
                <InfrastructureNodeCard key={node.internal_id} node={node} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {nodes.length > 0 && (
        <Card className="mb-8">
          <CardHeader className="relative">
            <CardTitle>Battery & Channel Utilisation</CardTitle>
            <CardDescription>Per-node metrics over time. Both charts share the same time range.</CardDescription>
            <div className="absolute right-4 top-4">
              <TimeRangeSelect
                options={CHART_TIME_RANGE_OPTIONS}
                value={chartTimeRangeLabel}
                onChange={handleChartTimeRangeChange}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <MonitoredNodesBatteryChart
              nodes={nodes}
              dateRange={chartDateRange}
              timeRangeLabel={chartTimeRangeLabel}
              onTimeRangeChange={handleChartTimeRangeChange}
              hideTimeRangePicker
            />
            <MonitoredNodesChannelUtilChart nodes={nodes} dateRange={chartDateRange} hideTimeRangePicker />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            All Infrastructure Nodes ({sortedNodes.length}
            {totalNodes > sortedNodes.length ? ` of ${totalNodes}` : ''})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNodes.map((node) => (
            <InfrastructureNodeCard key={node.internal_id} node={node} />
          ))}
        </div>
        {hasNextPage && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => fetchNextPage()}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function MeshInfrastructure() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center min-h-screen items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }
    >
      <MeshInfrastructureContent />
    </Suspense>
  );
}
