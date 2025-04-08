import { useParams, Link } from 'react-router-dom';
import { useNodes } from '@/lib/hooks/useNodes';
import { formatDistanceToNow } from 'date-fns';
import { BatteryChartShadcn } from '@/components/BatteryChartShadcn';
import { NodesMap } from '@/components/nodes/NodesMap';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function NodeDetails() {
  const { id } = useParams<{ id: string }>();
  const nodeId = parseInt(id || '0', 10);
  const { useNode, useNodePositions } = useNodes();

  const nodeQuery = useNode(nodeId);
  const positionsQuery = useNodePositions(nodeId);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/nodes" className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
        ← Back to Nodes
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6">{node.short_name}</h1>
        <p className="text-gray-600 mb-8">{node.long_name}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
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
          </div>

          {node.latest_device_metrics && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Device Metrics</h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Battery Level:</span> {node.latest_device_metrics.battery_level}%
                </p>
                <p>
                  <span className="font-medium">Voltage:</span> {node.latest_device_metrics.voltage}V
                </p>
                <p>
                  <span className="font-medium">Channel Utilization:</span> {node.latest_device_metrics.chUtil}%
                </p>
                <p>
                  <span className="font-medium">Air Utilization:</span> {node.latest_device_metrics.airUtil}%
                </p>
                <p>
                  <span className="font-medium">Uptime:</span> {Math.round(node.latest_device_metrics.uptime / 3600)}{' '}
                  hours
                </p>
              </div>
            </div>
          )}

          {positions && positions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Last Known Position</h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Latitude:</span> {positions[0].latitude.toFixed(6)}°
                </p>
                <p>
                  <span className="font-medium">Longitude:</span> {positions[0].longitude.toFixed(6)}°
                </p>
                <p>
                  <span className="font-medium">Altitude:</span> {positions[0].altitude.toFixed(1)}m
                </p>
                <p>
                  <span className="font-medium">Location Source:</span> {positions[0].location_source}
                </p>
                <p>
                  <span className="font-medium">Reported:</span>{' '}
                  {formatDistanceToNow(positions[0].reported_time, { addSuffix: true })}
                </p>
              </div>
            </div>
          )}
        </div>

        {positions && positions.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Node Location</CardTitle>
              </CardHeader>
              <CardContent>
                <NodesMap nodes={[node]} />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Battery History</h2>
          <BatteryChartShadcn nodeId={nodeId} />
        </div>
      </div>
    </div>
  );
}
