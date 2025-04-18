import { useParams, Link } from 'react-router-dom';
import { useNodes } from '@/lib/hooks/useNodes';
import { useRecentNodes } from '@/lib/hooks/useRecentNodes';
import { formatDistanceToNow } from 'date-fns';
import { BatteryChartShadcn } from '@/components/BatteryChartShadcn';
import { NodesMap } from '@/components/nodes/NodesMap';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Pause, Play } from 'lucide-react';

export function NodeDetails() {
  const { id } = useParams<{ id: string }>();
  const nodeId = parseInt(id || '0', 10);
  const { useNode, useNodePositions } = useNodes();
  const { recentNodes, addRecentNode } = useRecentNodes();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState<number | false>(30000); // 30 seconds

  const nodeQuery = useNode(nodeId, {
    refetchInterval: autoRefresh ? refreshInterval : false,
  });
  const positionsQuery = useNodePositions(nodeId);

  // Add node to recently viewed list only when nodeId changes or on initial load
  useEffect(() => {
    if (nodeQuery.data) {
      addRecentNode(nodeQuery.data);
    }
  }, [nodeId, addRecentNode]);

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  if (nodeQuery.isLoading || positionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (nodeQuery.error || !nodeQuery.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">
          Error: {nodeQuery.error instanceof Error ? nodeQuery.error.message : 'Failed to fetch node details'}
        </div>
      </div>
    );
  }

  const node = nodeQuery.data;
  const positions = positionsQuery.data;
  const hasPositions =
    positions &&
    positions.length > 0 &&
    positions[0].latitude !== 0 &&
    positions[0].longitude !== 0 &&
    positions[0].altitude !== 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/nodes" replace={true} className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
        ← Back to Nodes
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{node.short_name}</h1>
        <p className="text-gray-600">{node.long_name}</p>
      </div>

      {recentNodes.length > 1 && (
        <div className="mb-6">
          <div className="text-sm text-gray-500 mb-2">Recently viewed:</div>
          <div className="flex flex-wrap gap-2">
            {recentNodes
              .filter((recentNode) => recentNode.id !== nodeId) // Filter out current node
              .map((recentNode) => (
                <Link
                  key={recentNode.id}
                  to={`/nodes/${recentNode.id}`}
                  replace={true}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-blue-600 rounded-full text-sm"
                >
                  {recentNode.short_name}
                </Link>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Static node details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Node ID:</span> {node.node_id}
              </p>
              <p>
                <span className="font-medium">Hardware Model:</span> {node.hardware_model}
              </p>
              <p>
                <span className="font-medium">Meshtastic Version:</span> {node.meshtastic_version}
              </p>
              <p>
                <span className="font-medium">Last Heard:</span>{' '}
                {node.last_heard ? formatDistanceToNow(node.last_heard, { addSuffix: true }) : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>

        {node.latest_device_metrics && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Device Metrics</CardTitle>
                <CardDescription>
                  {formatDistanceToNow(node.latest_device_metrics.time, { addSuffix: true })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleAutoRefresh} className="flex items-center gap-1">
                  {autoRefresh ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Resume</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => nodeQuery.refetch()}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Battery Level:</span> {node.latest_device_metrics.battery_level}%
                </p>
                <p>
                  <span className="font-medium">Voltage:</span> {node.latest_device_metrics.voltage.toFixed(2)}V
                </p>
                <p>
                  <span className="font-medium">Channel Utilization:</span>{' '}
                  {node.latest_device_metrics.chUtil.toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium">Air Utilization:</span> {node.latest_device_metrics.airUtil.toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium">Uptime:</span> {Math.round(node.latest_device_metrics.uptime / 3600)}{' '}
                  hours
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Node Location</CardTitle>
            {hasPositions ? (
              <CardDescription>
                Last position reported {formatDistanceToNow(positions[0].reported_time, { addSuffix: true })}
              </CardDescription>
            ) : (
              <CardDescription>No position data available</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {hasPositions ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Latitude</p>
                    <p className="text-lg">{positions[0].latitude.toFixed(6)}°</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Longitude</p>
                    <p className="text-lg">{positions[0].longitude.toFixed(6)}°</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Altitude</p>
                    <p className="text-lg">{positions[0].altitude.toFixed(1)}m</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Location Source</p>
                  <p>{positions[0].location_source}</p>
                </div>
                <div className="h-[400px] w-full">
                  <NodesMap nodes={[node]} />
                </div>
              </>
            ) : (
              <div className="h-[200px] w-full flex items-center justify-center bg-muted rounded-md">
                <p className="text-muted-foreground">No location data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <BatteryChartShadcn nodeId={nodeId} defaultTimeRange={'48h'} />
      </div>
    </div>
  );
}
