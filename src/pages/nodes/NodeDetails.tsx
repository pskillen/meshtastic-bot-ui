import { useParams, Link } from 'react-router-dom';
import { useNodeSuspense, useNodePositions, useManagedNodesSuspense } from '@/hooks/api/useNodes';
import { useRecentNodes } from '@/hooks/useRecentNodes';
import { formatDistanceToNow } from 'date-fns';
import { BatteryChartShadcn } from '@/components/BatteryChartShadcn';
import { PacketTypeChart } from '@/components/PacketTypeChart';
import { ReceivedPacketTypeChart } from '@/components/ReceivedPacketTypeChart';
import { NodesMap } from '@/components/nodes/NodesMap';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Play, CheckCircle, Clock } from 'lucide-react';
import { useNodeClaimStatusSuspense } from '@/hooks/api/useNodeClaims';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { NotFoundError } from '@/lib/types';
import { NodeClaim } from '@/lib/models';

function NodeDetailsContent({ claimStatus }: { claimStatus: NodeClaim | undefined }) {
  const { id } = useParams<{ id: string }>();
  const nodeId = parseInt(id || '0', 10);
  const node = useNodeSuspense(nodeId);
  const positionsQuery = useNodePositions(nodeId);
  const { recentNodes, addRecentNode } = useRecentNodes();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get all managed nodes to check if this node is managed
  const { managedNodes } = useManagedNodesSuspense();

  // Check if this node is a managed node
  const isManagedNode = useMemo(() => {
    return managedNodes.some((managedNode) => managedNode.node_id === nodeId);
  }, [managedNodes, nodeId]);

  // Add node to recently viewed list only when nodeId changes or on initial load
  useEffect(() => {
    if (node) {
      addRecentNode(node);
    }
  }, [nodeId, addRecentNode]);

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const positions = positionsQuery.data;
  const hasPositions =
    positions &&
    positions.length > 0 &&
    positions[0].latitude !== 0 &&
    positions[0].longitude !== 0 &&
    positions[0].altitude !== 0;

  // Determine claim status
  const hasPendingClaim = claimStatus && !claimStatus.accepted_at;
  const hasApprovedClaim = claimStatus && claimStatus.accepted_at;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/nodes" replace={true} className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
        ← Back to Nodes
      </Link>

      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{node.short_name}</h1>
          <p className="text-gray-600">{node.long_name}</p>
          {(hasPendingClaim || hasApprovedClaim) && (
            <div className="mt-2 flex items-center">
              {hasPendingClaim ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Claim Pending</span>
                </Badge>
              ) : (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Claimed by You</span>
                </Badge>
              )}
            </div>
          )}
        </div>
        {(!node.owner || hasPendingClaim) && (
          <Link
            to={`/nodes/${nodeId}/claim`}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {hasPendingClaim ? 'View Claim Details' : 'Claim Node'}
          </Link>
        )}
      </div>

      {recentNodes.length > 1 && (
        <div className="mb-6">
          <div className="text-sm text-gray-500 mb-2">Recently viewed:</div>
          <div className="flex flex-wrap gap-2">
            {recentNodes
              .filter((recentNode) => recentNode.node_id !== nodeId) // Filter out current node
              .map((recentNode) => (
                <Link
                  key={recentNode.node_id}
                  to={`/nodes/${recentNode.node_id}`}
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
                <span className="font-medium">Node ID:</span> {node.node_id_str}
              </p>
              <p>
                <span className="font-medium">Hardware Model:</span> {node.hw_model}
              </p>
              <p>
                <span className="font-medium">Meshtastic Version:</span> {node.sw_version}
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
                  {formatDistanceToNow(node.latest_device_metrics.reported_time, { addSuffix: true })}
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
                {/* Manual refresh removed for Suspense version */}
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
                  {node.latest_device_metrics.channel_utilization.toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium">Air Utilization:</span>{' '}
                  {node.latest_device_metrics.air_util_tx.toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium">Uptime:</span>{' '}
                  {Math.round(node.latest_device_metrics.uptime_seconds / 3600)} hours
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
                <div className="flex flex-wrap md:flex-nowrap gap-4 mb-2 items-end">
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Lat</span>
                    <span className="text-base font-mono">{positions[0].latitude.toFixed(6)}°</span>
                  </div>
                  <span className="hidden md:inline-block h-6 border-l border-gray-200 mx-2"></span>
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Long</span>
                    <span className="text-base font-mono">{positions[0].longitude.toFixed(6)}°</span>
                  </div>
                  <span className="hidden md:inline-block h-6 border-l border-gray-200 mx-2"></span>
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Alt</span>
                    <span className="text-base font-mono">{positions[0].altitude.toFixed(1)}m</span>
                  </div>
                  {positions[0].location_source && (
                    <span className="ml-4 px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground border border-gray-200">
                      {positions[0].location_source}
                    </span>
                  )}
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

      <div className="mb-6">
        <PacketTypeChart nodeId={nodeId} defaultTimeRange={'48h'} />
      </div>

      {isManagedNode && (
        <div className="mb-6">
          <ReceivedPacketTypeChart nodeId={nodeId} defaultTimeRange={'48h'} />
        </div>
      )}
    </div>
  );
}

function NodeClaimStatusBoundary({
  nodeId,
  children,
}: {
  nodeId: number;
  children: (props: { claimStatus: NodeClaim | undefined }) => React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }: FallbackProps) => {
        if (error instanceof NotFoundError) {
          // Not an error: node just isn't claimed
          return children({ claimStatus: undefined });
        }
        // For other errors, show a generic error UI
        return (
          <div className="flex items-center justify-center min-h-screen text-red-600">
            <div>Something went wrong: {error instanceof Error ? error.message : String(error)}</div>
          </div>
        );
      }}
    >
      <NodeClaimStatusBoundaryInner nodeId={nodeId} children={children} />
    </ErrorBoundary>
  );
}

function NodeClaimStatusBoundaryInner({
  nodeId,
  children,
}: {
  nodeId: number;
  children: (props: { claimStatus: NodeClaim | undefined }) => React.ReactNode;
}) {
  const { claimStatus } = useNodeClaimStatusSuspense(nodeId);
  return <>{children({ claimStatus })}</>;
}

export function NodeDetails() {
  const { id } = useParams<{ id: string }>();
  const nodeId = parseInt(id || '0', 10);
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <NodeClaimStatusBoundary nodeId={nodeId}>
        {({ claimStatus }) => <NodeDetailsContent claimStatus={claimStatus} />}
      </NodeClaimStatusBoundary>
    </Suspense>
  );
}
