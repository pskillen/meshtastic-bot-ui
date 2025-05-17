import { useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUserClaims } from '@/hooks/api/useNodeClaims';
import { useMyManagedNodesSuspense, useMyClaimedNodesSuspense } from '@/hooks/api/useNodes';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Info, Copy, Radio, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ObservedNode } from '@/lib/models';
import { SetupManagedNode } from '@/components/nodes/SetupManagedNode';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMeshtasticApi } from '@/hooks/api/useApi';
// TODO: Add QRCode support for API keys in the future

function NodeSettingsContent() {
  const api = useMeshtasticApi();
  const { data: claims, isLoading: isLoadingClaims, error: claimsError } = useUserClaims();
  const { myManagedNodes } = useMyManagedNodesSuspense();
  const { myClaimedNodes } = useMyClaimedNodesSuspense();
  const [selectedNode, setSelectedNode] = useState<ObservedNode | null>(null);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [selectedConstellation, setSelectedConstellation] = useState<number | null>(null);
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [assignKeyId, setAssignKeyId] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAssignNodes, setSelectedAssignNodes] = useState<number[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toggleKeyId, setToggleKeyId] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const queryClient = useQueryClient();

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

  const handleCreateApiKey = async () => {
    if (!newApiKeyName || !selectedConstellation) {
      setApiKeyError('Please provide a name and select a constellation');
      return;
    }

    setIsCreatingApiKey(true);
    setApiKeyError(null);

    try {
      await api.createApiKey(newApiKeyName, selectedConstellation);
      setNewApiKeyName('');
      setSelectedConstellation(null);
      // Refetch API keys
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    } catch (error) {
      setApiKeyError('Failed to create API key. Please try again.');
      console.error('Error creating API key:', error);
    } finally {
      setIsCreatingApiKey(false);
    }
  };

  // Create a Set of managed node IDs for quick lookup
  const managedNodeIds = new Set(myManagedNodes.map((n) => n.node_id));

  // Fetch API keys
  const { data: apiKeys, isLoading: isLoadingApiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.getApiKeys(),
  });

  // Assign/unassign nodes modal logic
  const openAssignModal = (keyId: string, currentNodes: number[]) => {
    setAssignKeyId(keyId);
    setSelectedAssignNodes(currentNodes);
    setAssignModalOpen(true);
  };
  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setAssignKeyId(null);
    setSelectedAssignNodes([]);
  };
  const handleAssignNodes = async () => {
    if (!assignKeyId) return;
    setIsAssigning(true);
    try {
      // Find the API key
      const apiKey = apiKeys?.find((k) => k.id === assignKeyId);
      if (!apiKey) return;
      // Add new nodes
      for (const nodeId of selectedAssignNodes) {
        if (!apiKey.nodes.includes(nodeId)) {
          await api.addNodeToApiKey(assignKeyId, nodeId);
        }
      }
      // Remove unselected nodes
      for (const nodeId of apiKey.nodes) {
        if (!selectedAssignNodes.includes(nodeId)) {
          await api.removeNodeFromApiKey(assignKeyId, nodeId);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      closeAssignModal();
    } finally {
      setIsAssigning(false);
    }
  };

  // Delete API key
  const handleDeleteKey = async (keyId: string) => {
    setDeleteKeyId(keyId);
    setIsDeleting(true);
    try {
      await api.deleteApiKey(keyId);
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    } finally {
      setIsDeleting(false);
      setDeleteKeyId(null);
    }
  };

  // Toggle active/inactive
  const handleToggleKey = async (keyId: string, isActive: boolean) => {
    setToggleKeyId(keyId);
    setIsToggling(true);
    try {
      await api.updateApiKey(keyId, { is_active: !isActive });
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    } finally {
      setIsToggling(false);
      setToggleKeyId(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 px-6">
      <h1 className="text-3xl font-bold mb-6">Node Settings</h1>

      {selectedNode && (
        <SetupManagedNode node={selectedNode} isOpen={isSetupDialogOpen} onClose={handleCloseSetupDialog} />
      )}

      <Tabs defaultValue="claims">
        <TabsList className="mb-4">
          <TabsTrigger value="claims">Node Claims</TabsTrigger>
          <TabsTrigger value="managed">Managed Nodes</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
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
                          <p className="text-sm font-medium">Managed Node Setup Instructions:</p>
                          <Alert className="mt-2">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Setup Instructions</AlertTitle>
                            <AlertDescription className="text-xs">
                              <ol className="list-decimal list-inside space-y-1 mt-1">
                                <li>Go to the API Keys tab and create or select an API key</li>
                                <li>Install the Meshtastic Bot software on your device (e.g., Raspberry Pi)</li>
                                <li>Connect your Meshtastic device to your computer</li>
                                <li>Configure the bot with your API key</li>
                                <li>Start the bot</li>
                              </ol>
                            </AlertDescription>
                          </Alert>

                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">Hardware Requirements:</p>
                            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                              <li>Meshtastic-compatible device (e.g., T-Beam, T-Echo, etc.)</li>
                              <li>Computer or single-board computer (e.g., Raspberry Pi)</li>
                              <li>USB cable to connect the device</li>
                            </ul>
                          </div>

                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">Software Configuration:</p>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-1">
                              {`# Example configuration
MESHFLOW_API_URL=https://api.example.com
MESHFLOW_API_KEY=<your_api_key>  # From API Keys tab
SERIAL_PORT=/dev/ttyUSB0  # Adjust for your system`}
                            </pre>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/nodes/${node.node_id}`, '_blank')}
                            >
                              View Node Details
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                document.querySelector('[data-value="apikeys"]')?.dispatchEvent(new MouseEvent('click'))
                              }
                            >
                              Go to API Keys
                            </Button>
                          </div>
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

        <TabsContent value="apikeys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for your managed nodes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingApiKeys ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : apiKeys && apiKeys.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="border rounded-md p-4 bg-white shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{apiKey.name}</h3>
                            <p className="text-xs text-gray-400">
                              Created: {new Date(apiKey.created_at).toLocaleString()}
                            </p>
                            {apiKey.last_used && (
                              <p className="text-xs text-gray-400">
                                Last used: {new Date(apiKey.last_used).toLocaleString()}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Constellation:{' '}
                              {myManagedNodes.find((n) => n.constellation.id === apiKey.constellation)?.constellation
                                .name || apiKey.constellation}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={apiKey.is_active ? 'default' : 'outline'}>
                              {apiKey.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleKey(apiKey.id, apiKey.is_active)}
                              disabled={isToggling && toggleKeyId === apiKey.id}
                              title={apiKey.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {apiKey.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteKey(apiKey.id)}
                              disabled={isDeleting && deleteKeyId === apiKey.id}
                              title="Delete API Key"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">API Key:</span>
                            <span className="bg-gray-100 p-2 rounded font-mono text-sm truncate select-all">
                              {apiKey.key}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyToClipboard(apiKey.key)}
                              className="ml-2"
                            >
                              {' '}
                              <Copy className="h-4 w-4 mr-1" />
                              Copy{' '}
                            </Button>
                            {/* QR code placeholder */}
                            <span className="ml-2"> {/* <QRCode value={apiKey.key} size={32} /> */} </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="text-sm font-medium">Assigned Nodes:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {apiKey.nodes.length > 0 ? (
                              apiKey.nodes.map((nodeId) => {
                                const node = myManagedNodes.find((n) => n.node_id === nodeId);
                                return (
                                  <Badge key={nodeId} variant="outline" className="text-xs">
                                    {node ? node.short_name || node.node_id_str : `Node ${nodeId}`}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-xs text-gray-400">No nodes assigned</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => openAssignModal(apiKey.id, apiKey.nodes)}
                          >
                            Assign/Remove Nodes
                          </Button>
                        </div>
                        <div className="mt-2">
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Setup Instructions</AlertTitle>
                            <AlertDescription className="text-xs">
                              To use this API key with your managed node, configure your Meshtastic Bot with this key.
                              <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                {`# Example configuration\nMESHFLOW_API_URL=https://api.example.com\nMESHFLOW_API_KEY=${apiKey.key}\nSERIAL_PORT=/dev/ttyUSB0  # Adjust for your system`}
                              </pre>
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium mb-2">Create New API Key</h3>
                    {apiKeyError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{apiKeyError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid gap-4">
                      <div>
                        <label htmlFor="api-key-name" className="block text-sm font-medium mb-1">
                          API Key Name
                        </label>
                        <input
                          id="api-key-name"
                          type="text"
                          className="w-full p-2 border rounded-md"
                          value={newApiKeyName}
                          onChange={(e) => setNewApiKeyName(e.target.value)}
                          placeholder="Enter a name for your API key"
                        />
                      </div>
                      <div>
                        <label htmlFor="constellation" className="block text-sm font-medium mb-1">
                          Constellation
                        </label>
                        <select
                          id="constellation"
                          className="w-full p-2 border rounded-md"
                          value={selectedConstellation || ''}
                          onChange={(e) => setSelectedConstellation(e.target.value ? Number(e.target.value) : null)}
                        >
                          <option value="">Select a constellation</option>
                          {myManagedNodes.map((node) => (
                            <option key={node.constellation.id} value={node.constellation.id}>
                              {node.constellation.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        onClick={handleCreateApiKey}
                        disabled={isCreatingApiKey || !newApiKeyName || !selectedConstellation}
                        className="flex items-center"
                      >
                        {isCreatingApiKey ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Create API Key
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No API Keys</AlertTitle>
                    <AlertDescription>
                      You don't have any API keys yet. Create one to use with your managed nodes.
                    </AlertDescription>
                  </Alert>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-2">Create New API Key</h3>
                    {apiKeyError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{apiKeyError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid gap-4">
                      <div>
                        <label htmlFor="api-key-name" className="block text-sm font-medium mb-1">
                          API Key Name
                        </label>
                        <input
                          id="api-key-name"
                          type="text"
                          className="w-full p-2 border rounded-md"
                          value={newApiKeyName}
                          onChange={(e) => setNewApiKeyName(e.target.value)}
                          placeholder="Enter a name for your API key"
                        />
                      </div>
                      <div>
                        <label htmlFor="constellation" className="block text-sm font-medium mb-1">
                          Constellation
                        </label>
                        <select
                          id="constellation"
                          className="w-full p-2 border rounded-md"
                          value={selectedConstellation || ''}
                          onChange={(e) => setSelectedConstellation(e.target.value ? Number(e.target.value) : null)}
                        >
                          <option value="">Select a constellation</option>
                          {myManagedNodes.map((node) => (
                            <option key={node.constellation.id} value={node.constellation.id}>
                              {node.constellation.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        onClick={handleCreateApiKey}
                        disabled={isCreatingApiKey || !newApiKeyName || !selectedConstellation}
                        className="flex items-center"
                      >
                        {isCreatingApiKey ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Create API Key
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {/* Assign/Remove Nodes Modal */}
              {assignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-medium mb-2">Assign/Remove Nodes</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Select nodes to assign to this API key:</label>
                      <div className="max-h-48 overflow-y-auto border rounded p-2">
                        {myManagedNodes.length > 0 ? (
                          myManagedNodes.map((node) => (
                            <div key={node.node_id} className="flex items-center gap-2 mb-1">
                              <input
                                type="checkbox"
                                id={`assign-node-${node.node_id}`}
                                checked={selectedAssignNodes.includes(node.node_id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAssignNodes((prev) => [...prev, node.node_id]);
                                  } else {
                                    setSelectedAssignNodes((prev) => prev.filter((id) => id !== node.node_id));
                                  }
                                }}
                              />
                              <label htmlFor={`assign-node-${node.node_id}`}>
                                {node.short_name || node.node_id_str}
                              </label>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No managed nodes available</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={closeAssignModal} disabled={isAssigning}>
                        Cancel
                      </Button>
                      <Button variant="default" size="sm" onClick={handleAssignNodes} disabled={isAssigning}>
                        {isAssigning ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
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
