import { useState, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMyClaimedNodesSuspense, useMyManagedNodesSuspense } from '@/hooks/api/useNodes';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Radio, Settings } from 'lucide-react';
import { ObservedNode } from '@/lib/models';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SetupManagedNode } from '@/components/nodes/SetupManagedNode';
import { NodesMap } from '@/components/nodes/NodesMap';
import { MonitoredNodesBatteryChart } from '@/components/nodes/MonitoredNodesBatteryChart';

function MyNodesContent() {
  const navigate = useNavigate();
  const { myClaimedNodes } = useMyClaimedNodesSuspense();
  const { myManagedNodes } = useMyManagedNodesSuspense();
  const [selectedNode, setSelectedNode] = useState<ObservedNode | null>(null);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [error] = useState<string | null>(null);

  // Create a Set of managed node IDs for quick lookup
  const managedNodeIds = new Set(myManagedNodes.map((n) => n.node_id));

  const handleRunAsManagedNode = (node: ObservedNode) => {
    setSelectedNode(node);
    setIsSetupDialogOpen(true);
  };

  const handleCloseSetupDialog = () => {
    setIsSetupDialogOpen(false);
    setSelectedNode(null);
  };

  // Combine claimed and managed nodes into a unified list
  const allNodes = [...myClaimedNodes];

  // Add managed nodes that aren't already in the claimed nodes list
  myManagedNodes.forEach((managedNode) => {
    if (!allNodes.some((node) => node.node_id === managedNode.node_id)) {
      allNodes.push(managedNode as unknown as ObservedNode);
    }
  });

  // Custom table component that extends MonitoredNodesTable to include claim/manage status
  const MyNodesTable = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Nodes</CardTitle>
          <CardDescription>
            These are your observed and managed nodes. You can view details and manage them from here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Short Name</TableHead>
                <TableHead>Long Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Heard</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Position</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allNodes.map((node) => {
                const isManaged = managedNodeIds.has(node.node_id);
                const isClaimed = node.owner?.id !== undefined;

                return (
                  <TableRow key={node.node_id}>
                    <TableCell>
                      <div>
                        {node.short_name || node.node_id_str}
                        <div className="text-xs text-muted-foreground">{node.node_id_str}</div>
                      </div>
                    </TableCell>
                    <TableCell>{node.long_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {isManaged && <Badge variant="outline">Managed</Badge>}
                        {isClaimed && <Badge variant="outline">Claimed</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{node.last_heard ? new Date(node.last_heard).toLocaleString() : 'Never'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>
                          {node.latest_device_metrics?.battery_level
                            ? `${node.latest_device_metrics.battery_level}%`
                            : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {node.latest_device_metrics?.voltage
                            ? `${node.latest_device_metrics.voltage.toFixed(2)}V`
                            : '-'}
                        </div>
                        {node.latest_device_metrics?.reported_time && (
                          <div className="text-xs text-muted-foreground">
                            Updated: {new Date(node.latest_device_metrics.reported_time).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {node.latest_position ? (
                        <div className="space-y-1">
                          <div>
                            {node.latest_position.latitude.toFixed(6)}, {node.latest_position.longitude.toFixed(6)}
                          </div>
                          {node.latest_position.reported_time && (
                            <div className="text-xs text-muted-foreground">
                              Updated: {new Date(node.latest_position.reported_time).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!isManaged && (
                          <Button
                            onClick={() => handleRunAsManagedNode(node)}
                            size="sm"
                            variant="outline"
                            className="flex items-center text-xs"
                          >
                            <Radio className="mr-1 h-3 w-3" />
                            Convert
                          </Button>
                        )}
                        <Button
                          onClick={() => navigate(`/nodes/${node.node_id}`)}
                          size="sm"
                          variant="outline"
                          className="flex items-center"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Nodes</h1>
        <Button variant="outline" onClick={() => navigate('/user/nodes')} className="flex items-center">
          <Settings className="mr-2 h-4 w-4" />
          Node Settings
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedNode && (
        <SetupManagedNode node={selectedNode} isOpen={isSetupDialogOpen} onClose={handleCloseSetupDialog} />
      )}

      {allNodes.length > 0 ? (
        <>
          <div className="h-[400px] bg-background rounded-lg border">
            <NodesMap nodes={allNodes} />
          </div>

          <div className="bg-background rounded-lg border">
            <MonitoredNodesBatteryChart nodes={allNodes} />
          </div>

          <div className="bg-background rounded-lg border">
            <MyNodesTable />
          </div>
        </>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Nodes</AlertTitle>
          <AlertDescription>
            You don't have any nodes yet. Browse the{' '}
            <Link to="/nodes" className="text-blue-500 hover:text-blue-700">
              nodes list
            </Link>{' '}
            to find and claim a node.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function MyNodes() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <MyNodesContent />
    </Suspense>
  );
}
