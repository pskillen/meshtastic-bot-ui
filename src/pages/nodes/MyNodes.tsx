import { useState, Suspense, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMyClaimedNodesSuspense, useMyManagedNodesSuspense } from '@/hooks/api/useNodes';
import { useNodeWatches } from '@/hooks/api/useNodeWatches';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Radio, Settings, CheckCircle2 } from 'lucide-react';
import { useConfig } from '@/providers/ConfigProvider';
import { BotSetupInstructions, type BotDefaults } from '@/components/nodes/BotSetupInstructions';
import { ObservedNode, type NodeWatch } from '@/lib/models';
import { MeshWatchControls } from '@/components/nodes/MeshWatchControls';
import type { NodeApiKeyConstellation } from '@/lib/models';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SetupManagedNode } from '@/components/nodes/SetupManagedNode';
import { NodesAndConstellationsMap } from '@/components/nodes/NodesAndConstellationsMap';
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
  const config = useConfig();
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

  const watchesQuery = useNodeWatches();
  const watchesByNodeIdStr = useMemo(() => {
    const m = new Map<string, NodeWatch>();
    for (const w of watchesQuery.data?.results ?? []) {
      m.set(w.observed_node.node_id_str, w);
    }
    return m;
  }, [watchesQuery.data]);

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
                <TableHead>Mesh watch</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allNodes.map((node) => {
                const isManaged = managedNodeIds.has(node.node_id);
                const isClaimed = node.owner?.id !== undefined;
                const watch = watchesByNodeIdStr.get(node.node_id_str);

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
                      {node.latest_position &&
                      typeof node.latest_position.latitude === 'number' &&
                      typeof node.latest_position.longitude === 'number' ? (
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
                      <MeshWatchControls
                        node={node}
                        watch={watch}
                        watchesQuery={watchesQuery}
                        idPrefix={`my-nodes-${node.node_id}`}
                      />
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
    const firstApiKey = nodeApiKeys[0]?.key;
    return (
      <Dialog
        open={instructionsModalOpen}
        onOpenChange={(open) => {
          if (!open) setInstructionsModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Managed Node Setup Instructions</DialogTitle>
            <DialogDescription>
              Setup instructions for{' '}
              <span className="font-bold">{showInstructionsNode.short_name || showInstructionsNode.node_id_str}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Node is Managed</AlertTitle>
              <AlertDescription>This node is set up as a managed node.</AlertDescription>
            </Alert>
            {firstApiKey && config ? (
              <BotSetupInstructions
                apiKey={firstApiKey}
                apiBaseUrl={config.apis.meshBot.baseUrl}
                nodeShortName={showInstructionsNode.short_name || showInstructionsNode.node_id_str}
                botDefaults={(() => {
                  const c = nodeApiKeys[0]?.constellation;
                  if (c && typeof c === 'object') {
                    const obj = c as NodeApiKeyConstellation;
                    return {
                      ignorePortnums: obj.bot_default_ignore_portnums ?? undefined,
                      hopLimit: obj.bot_default_hop_limit ?? undefined,
                    } as BotDefaults;
                  }
                  return undefined;
                })()}
              />
            ) : nodeApiKeys.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No API Key Assigned</AlertTitle>
                <AlertDescription>
                  No API key is assigned to this node. Go to Node Settings to assign an API key.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Setup Instructions Unavailable</AlertTitle>
                <AlertDescription>
                  Unable to load configuration. Please try again or check Node Settings.
                </AlertDescription>
              </Alert>
            )}
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
            <h2 className="text-lg font-semibold mb-2">Nodes and Constellations</h2>
            {/* Collapsible map section */}
            <CollapsibleSection title="Nodes and Constellations" defaultOpen>
              <div className="h-[600px] bg-background rounded-lg border">
                <NodesAndConstellationsMap
                  managedNodes={myManagedNodes}
                  observedNodes={myClaimedNodes}
                  showConstellation={true}
                  showUnmanagedNodes={true}
                />
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
