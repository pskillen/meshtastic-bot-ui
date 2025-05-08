import { useState, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMyClaimedNodesSuspense, useMyManagedNodesSuspense } from '@/hooks/api/useNodes';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Settings, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const handleRunAsManagedNode = (node: ObservedNode) => {
    setSelectedNode(node);
    setIsSetupDialogOpen(true);
  };

  const handleCloseSetupDialog = () => {
    setIsSetupDialogOpen(false);
    setSelectedNode(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Nodes</h1>

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

      <Tabs defaultValue="claimed">
        <TabsList className="mb-4">
          <TabsTrigger value="claimed">Claimed Nodes</TabsTrigger>
          <TabsTrigger value="managed">Managed Nodes</TabsTrigger>
        </TabsList>

        <TabsContent value="claimed">
          <Card>
            <CardHeader>
              <CardTitle>My Claimed Nodes</CardTitle>
              <CardDescription>
                These are nodes you have claimed ownership of. You can run them as managed nodes to help monitor the
                mesh network.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myClaimedNodes && myClaimedNodes.length > 0 ? (
                <div className="space-y-4">
                  {myClaimedNodes.map((node) => (
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
                            <p className="text-xs text-gray-500 mt-1">
                              Last heard:{' '}
                              {node.last_heard ? formatDistanceToNow(node.last_heard, { addSuffix: true }) : 'Never'}
                            </p>
                          </div>
                          <Button onClick={() => handleRunAsManagedNode(node)} size="sm" className="flex items-center">
                            <Radio className="mr-2 h-4 w-4" />
                            Run as Managed Node
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Claimed Nodes</AlertTitle>
                  <AlertDescription>
                    You haven't claimed any nodes yet. Browse the{' '}
                    <Link to="/nodes" className="text-blue-500 hover:text-blue-700">
                      nodes list
                    </Link>{' '}
                    to find and claim a node.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="managed">
          <Card>
            <CardHeader>
              <CardTitle>My Managed Nodes</CardTitle>
              <CardDescription>
                These are nodes you have set up to run as managed nodes. They help monitor the mesh network and forward
                messages to the Meshflow system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myManagedNodes && myManagedNodes.length > 0 ? (
                <div className="space-y-4">
                  {myManagedNodes.map((node) => (
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
                          <Button
                            onClick={() => navigate(`/nodes/${node.node_id}`)}
                            size="sm"
                            variant="outline"
                            className="flex items-center"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Managed Nodes</AlertTitle>
                  <AlertDescription>
                    You haven't set up any managed nodes yet. Go to the "Claimed Nodes" tab to set up a node as a
                    managed node.
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
