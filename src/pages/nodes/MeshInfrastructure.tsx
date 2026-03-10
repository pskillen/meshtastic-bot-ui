import { useMemo, useState, useCallback, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { subDays, subHours, format } from 'date-fns';
import { useInfrastructureNodesSuspense, useManagedNodesSuspense } from '@/hooks/api/useNodes';
import { useMultiNodeMetricsSuspense } from '@/hooks/api/useMultiNodeMetrics';
import { InfrastructureNodeCard } from '@/components/nodes/InfrastructureNodeCard';
import { NodesAndConstellationsMap } from '@/components/nodes/NodesAndConstellationsMap';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

const STALE_LOCATION_DAYS = 7;

function getLastLocationReported(node: ObservedNode): Date | null {
  const pos = node.latest_position as { reported_time?: Date | string } | null;
  if (!pos?.reported_time) return null;
  return new Date(pos.reported_time);
}

function hasRecentLocation(node: ObservedNode): boolean {
  const pos = node.latest_position as {
    latitude?: number;
    longitude?: number;
    reported_time?: Date | string;
  } | null;
  if (!pos) return false;
  const lat = pos.latitude;
  const lon = pos.longitude;
  if (lat == null || lon == null || lat === 0 || lon === 0) return false;
  const reportedTime = pos.reported_time ? new Date(pos.reported_time) : null;
  if (!reportedTime) return false;
  const cutoff = subDays(new Date(), STALE_LOCATION_DAYS);
  return reportedTime >= cutoff;
}

function MeshInfrastructureContent() {
  const [timeRange, setTimeRange] = useState<NodeListTimeRange>('30d');
  const [includeClientBase, setIncludeClientBase] = useState(false);
  const [chartTimeRangeLabel, setChartTimeRangeLabel] = useState('7d');
  const [chartDateRange, setChartDateRange] = useState<{ startDate: Date; endDate: Date }>({
    startDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  const lastHeardAfter = useMemo(() => getLastHeardAfter(timeRange), [timeRange]);

  const [selectedChartNodeIds, setSelectedChartNodeIds] = useState<Set<number>>(() => new Set());

  const { nodes, totalNodes, fetchNextPage, hasNextPage } = useInfrastructureNodesSuspense({
    lastHeardAfter,
    pageSize: 100,
    includeClientBase,
  });

  const { managedNodes } = useManagedNodesSuspense(500);

  const { metricsMap } = useMultiNodeMetricsSuspense(nodes, chartDateRange);

  const nodesWithLocation = useMemo(() => nodes.filter(hasRecentLocation), [nodes]);
  const nodesWithoutLocation = useMemo(() => nodes.filter((n) => !hasRecentLocation(n)), [nodes]);

  const sortedNodes = useMemo(
    () =>
      [...nodes].sort((a, b) => {
        if (!a.last_heard) return 1;
        if (!b.last_heard) return -1;
        return b.last_heard.getTime() - a.last_heard.getTime();
      }),
    [nodes]
  );

  const chartNodes = useMemo(
    () => nodes.filter((n) => selectedChartNodeIds.has(n.node_id)),
    [nodes, selectedChartNodeIds]
  );

  const handleCompareToggle = useCallback((nodeId: number, newState: boolean) => {
    const savedScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    setSelectedChartNodeIds((prev) => {
      const next = new Set(prev);
      if (newState) next.add(nodeId);
      else next.delete(nodeId);
      return next;
    });
    requestAnimationFrame(() => {
      if (typeof window !== 'undefined' && Math.abs(window.scrollY - savedScrollY) > 5) {
        window.scrollTo(0, savedScrollY);
      }
    });
  }, []);

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

      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4 mb-8">
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
        <div className="flex items-center gap-2">
          <label htmlFor="chart-time-range" className="text-sm text-muted-foreground">
            Chart time range:
          </label>
          <TimeRangeSelect
            options={CHART_TIME_RANGE_OPTIONS}
            value={chartTimeRangeLabel}
            onChange={handleChartTimeRangeChange}
          />
        </div>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure Node Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] w-full">
              <NodesAndConstellationsMap
                observedNodes={nodesWithLocation}
                managedNodes={managedNodes}
                showConstellation={true}
                showUnmanagedNodes={true}
                drawPositionUncertainty={true}
                enableBubbles={true}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {nodesWithoutLocation.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinOff className="h-5 w-5" />
              Nodes without recent location
            </CardTitle>
            <CardDescription>
              Infrastructure nodes that have not published location in the last 7 days ({nodesWithoutLocation.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Node</TableHead>
                  <TableHead>Node ID</TableHead>
                  <TableHead>Last Location Reported</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="w-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodesWithoutLocation.map((node) => {
                  const lastLocation = getLastLocationReported(node);
                  return (
                    <TableRow key={node.internal_id}>
                      <TableCell>
                        <Link to={`/nodes/${node.node_id}`} className="font-medium text-primary hover:underline">
                          {node.long_name} ({node.short_name || node.node_id_str})
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{node.node_id_str}</TableCell>
                      <TableCell>{lastLocation ? format(lastLocation, 'PPpp') : 'Never'}</TableCell>
                      <TableCell>{node.owner?.username ?? '—'}</TableCell>
                      <TableCell>
                        <Link to={`/nodes/${node.node_id}`} className="text-primary text-sm hover:underline">
                          View details
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
            <InfrastructureNodeCard
              key={node.internal_id}
              node={node}
              metrics={metricsMap[node.node_id] ?? []}
              dateRange={chartDateRange}
              onCompareToggle={handleCompareToggle}
            />
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

      {nodes.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Battery & Channel Utilisation</CardTitle>
            <CardDescription>
              {chartNodes.length > 0
                ? `Comparing ${chartNodes.length} node${chartNodes.length === 1 ? '' : 's'}. Tick the checkbox on node cards above to add or remove.`
                : 'Tick the checkbox on node cards above to add nodes to these charts.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {chartNodes.length > 0 ? (
              <>
                <MonitoredNodesBatteryChart
                  nodes={chartNodes}
                  dateRange={chartDateRange}
                  timeRangeLabel={chartTimeRangeLabel}
                  onTimeRangeChange={handleChartTimeRangeChange}
                  hideTimeRangePicker
                  metricsMap={metricsMap}
                  metricsQueryNodes={nodes}
                />
                <MonitoredNodesChannelUtilChart
                  nodes={chartNodes}
                  dateRange={chartDateRange}
                  hideTimeRangePicker
                  metricsMap={metricsMap}
                  metricsQueryNodes={nodes}
                />
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No nodes selected for comparison. Tick the &quot;Compare&quot; checkbox on any node card above.
              </div>
            )}
          </CardContent>
        </Card>
      )}
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
