import { useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUserClaims } from '@/hooks/api/useNodeClaims';
import { useMyManagedNodesSuspense, useMyClaimedNodesSuspense } from '@/hooks/api/useNodes';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Info, Copy, Radio } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ObservedNode } from '@/lib/models';
import { SetupManagedNode } from '@/components/nodes/SetupManagedNode';

function NodeSettingsContent() {
  const { data: claims, isLoading: isLoadingClaims, error: claimsError } = useUserClaims();
  const { myManagedNodes } = useMyManagedNodesSuspense();
  const { myClaimedNodes } = useMyClaimedNodesSuspense();
  const [selectedNode, setSelectedNode] = useState<ObservedNode | null>(null);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);

  const handleRunAsManagedNode = (node: ObservedNode) => {
    setSelectedNode(node);
    setIsSetupDialogOpen(true);
  };

  const handleCloseSetupDialog = () => {
    setIsSetupDialogOpen(false);
    setSelectedNode(null);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Create a Set of managed node IDs for quick lookup
  const managedNodeIds = new Set(myManagedNodes.map((n) => n.node_id));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Node Settings</h1>

      {selectedNode && (
        <SetupManagedNode node={selectedNode} isOpen={isSetupDialogOpen} onClose={handleCloseSetupDialog} />
      )}

      <Tabs defaultValue="claims">
        <TabsList className="mb-4">
          <TabsTrigger value="claims">Node Claims</TabsTrigger>
          <TabsTrigger value="managed">Managed Nodes</TabsTrigger>
        </TabsList>

        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>My Node Claims</CardTitle>
              <CardDescription>View your pending and approved node claims</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingClaims ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : claimsError ? (
                <div className="text-red-500 py-4">Error loading claims: {claimsError.message}</div>
              ) : claims && claims.length > 0 ? (
                <div className="space-y-4">
                  {claims.map((claim) => {
                    const isPending = !claim.accepted_at;
                    return (
                      <div key={claim.node.node_id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{claim.node.short_name || claim.node.node_id_str}</h3>
                            <p className="text-sm text-gray-500">{claim.node.long_name}</p>
                            <p className="text-xs text-gray-400">Node ID: {claim.node.node_id_str}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Claimed {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge variant={isPending ? 'outline' : 'default'}>
                            {isPending ? 'Pending' : 'Approved'}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <Link
                            to={`/nodes/${claim.node.node_id}`}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                          >
                            View Node
                          </Link>
                          {isPending && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md">
                              <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">Claim Key:</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyToClipboard(claim.claim_key)}
                                  className="h-6 px-2"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <p className="font-mono text-sm mt-1">{claim.claim_key}</p>
                              <Alert className="mt-3">
                                <Info className="h-4 w-4" />
                                <AlertTitle>Claim Instructions</AlertTitle>
                                <AlertDescription className="text-xs">
                                  To complete the claim process, send this key as a direct message from your node to one
                                  of the managed nodes on the network.
                                </AlertDescription>
                              </Alert>
                            </div>
                          )}
                          {!isPending && !managedNodeIds.has(claim.node.node_id) && (
                            <div className="mt-2">
                              <Button
                                onClick={() => {
                                  // Find the node in myClaimedNodes
                                  const node = myClaimedNodes.find((n) => n.node_id === claim.node.node_id);
                                  if (node) {
                                    handleRunAsManagedNode(node);
                                  }
                                }}
                                size="sm"
                                variant="outline"
                                className="flex items-center text-xs"
                              >
                                <Radio className="mr-1 h-3 w-3" />
                                Convert to Managed Node
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-500 py-4">You don't have any node claims yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="managed">
          <Card>
            <CardHeader>
              <CardTitle>My Managed Nodes</CardTitle>
              <CardDescription>View and manage your monitoring nodes</CardDescription>
            </CardHeader>
            <CardContent>
              {myManagedNodes.length > 0 ? (
                <div className="space-y-4">
                  {myManagedNodes.map((node) => (
                    <div key={node.node_id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{node.short_name || node.node_id_str}</h3>
                          <p className="text-sm text-gray-500">{node.long_name}</p>
                          <div className="flex items-center mt-1">
                            <Badge
                              style={{ backgroundColor: node.constellation.map_color }}
                              className="text-white text-xs mr-2"
                            >
                              {node.constellation.name}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              Last heard:{' '}
                              {node.last_heard
                                ? formatDistanceToNow(new Date(node.last_heard), { addSuffix: true })
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link to={`/nodes/${node.node_id}`} className="text-blue-500 hover:text-blue-700 text-sm">
                          View Node Details
                        </Link>
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium">API Key Setup Instructions:</p>
                          <Alert className="mt-2">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Setup Instructions</AlertTitle>
                            <AlertDescription className="text-xs">
                              To set up this node for monitoring, you need to configure it with an API key. Visit the
                              node details page to view or create API keys.
                            </AlertDescription>
                          </Alert>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => window.open(`/nodes/${node.node_id}`, '_blank')}
                          >
                            View API Keys
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Managed Nodes</AlertTitle>
                  <AlertDescription>
                    You haven't set up any managed nodes yet. Go to the "Node Claims" tab to set up a node as a managed
                    node.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function NodeSettings() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <NodeSettingsContent />
    </Suspense>
  );
}
