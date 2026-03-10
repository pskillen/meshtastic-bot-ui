import { Link } from 'react-router-dom';
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
import { Pause, Play, CheckCircle, Clock, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { authService } from '@/lib/auth/authService';

interface NodeDetailContentProps {
  nodeId: number;
  /** When true, hide the "Back to Nodes" link (e.g. when shown in slide-over) */
  compact?: boolean;
}

const ROLE_LABELS: Record<number, string> = {
  0: 'CLIENT',
  1: 'CLIENT_MUTE',
  2: 'ROUTER',
  3: 'ROUTER_CLIENT',
  4: 'REPEATER',
  5: 'TRACKER',
  6: 'SENSOR',
  7: 'TAK',
  8: 'CLIENT_HIDDEN',
  9: 'LOST_AND_FOUND',
  10: 'TAK_TRACKER',
  11: 'ROUTER_LATE',
  12: 'CLIENT_BASE',
};

export function NodeDetailContent({ nodeId, compact = false }: NodeDetailContentProps) {
  const node = useNodeSuspense(nodeId);
  const positionsQuery = useNodePositions(nodeId);
  const { recentNodes, addRecentNode } = useRecentNodes();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const { managedNodes } = useManagedNodesSuspense();

  const isManagedNode = useMemo(() => {
    return managedNodes.some((managedNode) => managedNode.node_id === nodeId);
  }, [managedNodes, nodeId]);

  useEffect(() => {
    if (node) {
      addRecentNode(node);
    }
  }, [nodeId, addRecentNode, node]);

  const toggleAutoRefresh = () => setAutoRefresh(!autoRefresh);

  const positions = positionsQuery.data;
  const hasPositions =
    positions &&
    positions.length > 0 &&
    typeof positions[0].latitude === 'number' &&
    positions[0].latitude !== 0 &&
    typeof positions[0].longitude === 'number' &&
    positions[0].longitude !== 0;

  const currentUser = authService.getCurrentUser();
  const hasPendingClaim = node.claim && !node.claim.accepted_at;
  const hasApprovedClaim =
    (node.claim && node.claim.accepted_at) || (node.owner && currentUser && node.owner.id === currentUser.id);

  return (
    <div className={compact ? 'px-2' : 'container mx-auto px-4 py-8'}>
      {!compact && (
        <Link to="/nodes" replace={true} className="text-teal-600 dark:text-teal-400 hover:underline mb-4 inline-block">
          ← Back to Nodes
        </Link>
      )}

      <div className={`flex justify-between items-start ${compact ? 'mb-4' : 'mb-6'}`}>
        <div>
          <h1 className={`font-bold ${compact ? 'text-xl' : 'text-3xl'}`}>{node.short_name}</h1>
          <p className="text-slate-600 dark:text-slate-400">{node.long_name}</p>
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
            className="px-4 py-2 bg-teal-600 dark:bg-teal-500 text-white rounded-md hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors text-sm whitespace-nowrap"
          >
            {hasPendingClaim ? 'View Claim' : 'Claim Node'}
          </Link>
        )}
      </div>

      {!compact && recentNodes.length > 1 && (
        <div className="mb-6">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Recently viewed:</div>
          <div className="flex flex-wrap gap-2">
            {recentNodes
              .filter((recentNode) => recentNode.node_id !== nodeId)
              .map((recentNode) => (
                <Link
                  key={recentNode.node_id}
                  to={`/nodes/${recentNode.node_id}`}
                  replace={true}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 rounded-full text-sm"
                >
                  {recentNode.short_name}
                </Link>
              ))}
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${compact ? 'gap-4' : 'md:grid-cols-2 gap-6'} mb-6`}>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Static node details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Node ID:</span> <span className="font-mono">{node.node_id_str}</span>
              </p>
              <p>
                <span className="font-medium">Hardware Model:</span> {node.hw_model ?? '—'}
              </p>
              <p>
                <span className="font-medium">Meshtastic Version:</span> {node.sw_version ?? '—'}
              </p>
              {node.role != null && (
                <p>
                  <span className="font-medium">Role:</span> {ROLE_LABELS[node.role] ?? `Role ${node.role}`}
                </p>
              )}
              {node.mac_addr && (
                <p>
                  <span className="font-medium">MAC Address:</span> <span className="font-mono">{node.mac_addr}</span>
                </p>
              )}
              {node.public_key && (
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-medium shrink-0">Public Key:</span>
                  <span className="font-mono text-sm break-all">{node.public_key}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 shrink-0"
                    onClick={() => handleCopyToClipboard(node.public_key!)}
                    title="Copy public key"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </p>
              )}
              {(node.is_licensed === true || node.is_licensed === false) && (
                <p>
                  <span className="font-medium">Licensed Operator:</span> {node.is_licensed ? 'Yes' : 'No'}
                </p>
              )}
              {(node.is_unmessagable === true || node.is_unmessagable === false) && (
                <p>
                  <span className="font-medium">Messagable:</span> {node.is_unmessagable ? 'No' : 'Yes'}
                </p>
              )}
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
                  {node.latest_device_metrics.reported_time
                    ? formatDistanceToNow(node.latest_device_metrics.reported_time, { addSuffix: true })
                    : '—'}
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Battery Level:</span>{' '}
                  {node.latest_device_metrics.battery_level != null
                    ? `${node.latest_device_metrics.battery_level}%`
                    : '—'}
                </p>
                <p>
                  <span className="font-medium">Voltage:</span>{' '}
                  {node.latest_device_metrics.voltage != null
                    ? `${node.latest_device_metrics.voltage.toFixed(2)}V`
                    : '—'}
                </p>
                <p>
                  <span className="font-medium">Channel Utilization:</span>{' '}
                  {node.latest_device_metrics.channel_utilization != null
                    ? `${node.latest_device_metrics.channel_utilization.toFixed(1)}%`
                    : '—'}
                </p>
                <p>
                  <span className="font-medium">Air Utilization:</span>{' '}
                  {node.latest_device_metrics.air_util_tx != null
                    ? `${node.latest_device_metrics.air_util_tx.toFixed(1)}%`
                    : '—'}
                </p>
                <p>
                  <span className="font-medium">Uptime:</span>{' '}
                  {node.latest_device_metrics.uptime_seconds != null
                    ? `${Math.round(node.latest_device_metrics.uptime_seconds / 3600)} hours`
                    : '—'}
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
                Last position reported{' '}
                {positions[0].reported_time
                  ? formatDistanceToNow(positions[0].reported_time, { addSuffix: true })
                  : '—'}
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
                  <span className="hidden md:inline-block h-6 border-l border-slate-200 dark:border-slate-700 mx-2"></span>
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Long</span>
                    <span className="text-base font-mono">{positions[0].longitude.toFixed(6)}°</span>
                  </div>
                  <span className="hidden md:inline-block h-6 border-l border-slate-200 dark:border-slate-700 mx-2"></span>
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Alt</span>
                    <span className="text-base font-mono">
                      {positions[0].altitude != null ? `${positions[0].altitude.toFixed(1)}m` : '—'}
                    </span>
                  </div>
                  {positions[0].location_source && (
                    <span className="ml-4 px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground border border-slate-200 dark:border-slate-700">
                      {positions[0].location_source}
                    </span>
                  )}
                </div>
                <div className={`w-full ${compact ? 'h-[200px]' : 'h-[400px]'}`}>
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

      {!compact && (
        <>
          <div className="mb-6">
            <Suspense
              fallback={
                <Card>
                  <CardHeader>
                    <CardTitle>Battery</CardTitle>
                    <CardDescription>Loading chart…</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] flex items-center justify-center bg-muted rounded-md">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500" />
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <BatteryChartShadcn nodeId={nodeId} defaultTimeRange={'48h'} />
            </Suspense>
          </div>

          <div className="mb-6">
            <Suspense
              fallback={
                <Card>
                  <CardHeader>
                    <CardTitle>Packet Types</CardTitle>
                    <CardDescription>Loading chart…</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] flex items-center justify-center bg-muted rounded-md">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500" />
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <PacketTypeChart nodeId={nodeId} defaultTimeRange={'48h'} />
            </Suspense>
          </div>

          {isManagedNode && (
            <div className="mb-6">
              <Suspense
                fallback={
                  <Card>
                    <CardHeader>
                      <CardTitle>Received Packets</CardTitle>
                      <CardDescription>Loading chart…</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] flex items-center justify-center bg-muted rounded-md">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500" />
                      </div>
                    </CardContent>
                  </Card>
                }
              >
                <ReceivedPacketTypeChart nodeId={nodeId} defaultTimeRange={'48h'} />
              </Suspense>
            </div>
          )}
        </>
      )}

      {compact && (
        <Link to={`/nodes/${nodeId}`} className="text-teal-600 dark:text-teal-400 hover:underline text-sm">
          View full details →
        </Link>
      )}
    </div>
  );
}
