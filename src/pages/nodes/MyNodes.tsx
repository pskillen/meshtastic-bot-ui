import { useState, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMyClaimedNodesSuspense, useMyManagedNodesSuspense } from '@/hooks/api/useNodes';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Radio, Settings, CheckCircle2, Download } from 'lucide-react';
import { ObservedNode } from '@/lib/models';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SetupManagedNode } from '@/components/nodes/SetupManagedNode';
import { NodesMap } from '@/components/nodes/NodesMap';
import { MonitoredNodesBatteryChart } from '@/components/nodes/MonitoredNodesBatteryChart';
import { useQuery } from '@tanstack/react-query';
import { useMeshtasticApi } from '@/hooks/api/useApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function MyNodesContent() {
  const navigate = useNavigate();
  const { myClaimedNodes } = useMyClaimedNodesSuspense();
  const { myManagedNodes } = useMyManagedNodesSuspense();
  const [selectedNode, setSelectedNode] = useState<ObservedNode | null>(null);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [error] = useState<string | null>(null);
  const api = useMeshtasticApi();
  const [showInstructionsNode, setShowInstructionsNode] = useState<ObservedNode | null>(null);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const { data: apiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.getApiKeys(),
  });

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
                        {isManaged && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setShowInstructionsNode(node);
                              setInstructionsModalOpen(true);
                            }}
                          >
                            Show Setup Instructions
                          </Button>
                        )}
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

  // Setup Instructions Modal
  const renderInstructionsModal = () => {
    if (!showInstructionsNode) return null;
    const nodeApiKeys = apiKeys?.filter((key) => key.nodes.includes(showInstructionsNode.node_id)) || [];
    return (
      <Dialog
        open={instructionsModalOpen}
        onOpenChange={(open) => {
          if (!open) setInstructionsModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Managed Node Setup Instructions</DialogTitle>
            <DialogDescription>
              Setup instructions for{' '}
              <span className="font-bold">{showInstructionsNode.short_name || showInstructionsNode.node_id_str}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Node is Managed</AlertTitle>
              <AlertDescription>This node is set up as a managed node.</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Bot Setup Instructions</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Download the Meshtastic Bot software</li>
                <li>Install the software on your device (e.g., Raspberry Pi)</li>
                <li>Configure the bot with your API key</li>
                <li>Connect your Meshtastic device to your computer</li>
                <li>Start the bot</li>
              </ol>
              <div className="mt-4">
                <h4 className="text-md font-medium flex items-center gap-2">API Key(s) Assigned to this Node:</h4>
                {nodeApiKeys.length === 0 && (
                  <div className="text-xs text-red-600">No API key assigned to this node.</div>
                )}
                {nodeApiKeys.map((key) => (
                  <div key={key.id} className="mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 p-2 rounded font-mono text-sm select-all">{key.key}</span>
                      <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(key.key)}>
                        Copy
                      </Button>
                      {/* TODO: Add QRCode here in the future */}
                    </div>
                    <div className="text-xs text-gray-500">API Key Name: {key.name}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {`# Example configuration\nMESHFLOW_API_URL=https://api.example.com\nMESHFLOW_API_KEY=<your_api_key>\nSERIAL_PORT=/dev/ttyUSB0  # Adjust for your system`}
                </pre>
              </div>
              <div className="mt-4">
                <a
                  href="https://github.com/pskillen/meshtastic-bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Bot Software
                </a>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstructionsModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => navigate(`/nodes/${showInstructionsNode.node_id}`)}>Go to Node Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

      {renderInstructionsModal()}

      {allNodes.length > 0 ? (
        <>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Node Map</h2>
            {/* Collapsible map section */}
            <CollapsibleSection title="Node Map" defaultOpen>
              <div className="h-[400px] bg-background rounded-lg border">
                <NodesMap nodes={allNodes} />
              </div>
            </CollapsibleSection>
          </div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Battery Levels</h2>
            {/* Collapsible battery chart section */}
            <CollapsibleSection title="Battery Levels" defaultOpen>
              <div className="bg-background rounded-lg border">
                <MonitoredNodesBatteryChart nodes={allNodes} />
              </div>
            </CollapsibleSection>
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

// CollapsibleSection component (add at the bottom of the file)
function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} className="mb-2">
        {open ? 'Hide' : 'Show'} {title}
      </Button>
      {open && children}
    </div>
  );
}
