import { useState, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMyClaimedNodesSuspense, useMyManagedNodesSuspense } from '@/hooks/api/useNodes';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Radio, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ObservedNode } from '@/lib/models';
import { Badge } from '@/components/ui/badge';
import { SetupManagedNode } from '@/components/nodes/SetupManagedNode';

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Nodes</h1>
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

      <Card>
        <CardHeader>
          <CardTitle>My Nodes</CardTitle>
          <CardDescription>
            These are your observed and managed nodes. You can view details and manage them from here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allNodes && allNodes.length > 0 ? (
            <div className="space-y-4">
              {allNodes.map((node) => {
                const isManaged = managedNodeIds.has(node.node_id);
                const isClaimed = node.owner?.id !== undefined;

                return (
                  <Card key={node.node_id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">
                            <Link to={`/nodes/${node.node_id}`} className="text-blue-500 hover:text-blue-700">
                              {node.short_name || node.node_id_str}
                            </Link>
                          </h3>
                          <p className="text-sm text-gray-600">{node.long_name}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {isManaged && <Badge className="bg-green-500 text-white text-xs">Managed</Badge>}
                            {isClaimed && <Badge className="bg-blue-500 text-white text-xs">Claimed</Badge>}
                            <p className="text-xs text-gray-500">
                              Last heard:{' '}
                              {node.last_heard
                                ? formatDistanceToNow(new Date(node.last_heard), { addSuffix: true })
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!isManaged && (
                            <Button
                              onClick={() => handleRunAsManagedNode(node)}
                              size="sm"
                              variant="outline"
                              className="flex items-center text-xs"
                            >
                              <Radio className="mr-1 h-3 w-3" />
                              Convert to Managed Node
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
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
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
        </CardContent>
      </Card>
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
