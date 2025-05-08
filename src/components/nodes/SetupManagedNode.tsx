import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeshBotApi } from '@/lib/hooks/useApi';
import { NodeData, ManagedNode } from '@/lib/models';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface SetupManagedNodeProps {
  node: NodeData;
  isOpen: boolean;
  onClose: () => void;
}

type SetupStep = 'constellation' | 'api-key' | 'instructions';

export function SetupManagedNode({ node, isOpen, onClose }: SetupManagedNodeProps) {
  const navigate = useNavigate();
  const api = useMeshBotApi();

  const [currentStep, setCurrentStep] = useState<SetupStep>('constellation');
  const [selectedConstellation, setSelectedConstellation] = useState<number | null>(null);
  const [nodeName, setNodeName] = useState(node.short_name || node.node_id_str);
  const [apiKeyOption, setApiKeyOption] = useState<'existing' | 'new'>('existing');
  const [selectedApiKey, setSelectedApiKey] = useState<string | null>(null);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdManagedNode, setCreatedManagedNode] = useState<ManagedNode | null>(null);
  const [createdApiKey, setCreatedApiKey] = useState<any | null>(null);

  // Fetch constellations
  const constellationsQuery = useQuery({
    queryKey: ['constellations'],
    queryFn: () => api.getConstellations(),
  });

  // Fetch API keys
  const apiKeysQuery = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.getApiKeys(),
  });

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('constellation');
      setSelectedConstellation(null);
      setNodeName(node.short_name || node.node_id_str);
      setApiKeyOption('existing');
      setSelectedApiKey(null);
      setNewApiKeyName('');
      setIsLoading(false);
      setError(null);
      setCreatedManagedNode(null);
      setCreatedApiKey(null);
    }
  }, [isOpen, node]);

  const handleNextStep = () => {
    if (currentStep === 'constellation') {
      setCurrentStep('api-key');
    } else if (currentStep === 'api-key') {
      handleCreateManagedNode();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'api-key') {
      setCurrentStep('constellation');
    } else if (currentStep === 'instructions') {
      setCurrentStep('api-key');
    }
  };

  const handleCreateManagedNode = async () => {
    if (!selectedConstellation) {
      setError('Please select a constellation');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create the managed node
      const managedNode = await api.createManagedNode(node.node_id, selectedConstellation, nodeName);
      setCreatedManagedNode(managedNode);

      // Handle API key
      if (apiKeyOption === 'existing' && selectedApiKey) {
        // Add node to existing API key
        await api.addNodeToApiKey(selectedApiKey, managedNode.node_id);
      } else if (apiKeyOption === 'new' && newApiKeyName) {
        // Create new API key
        const apiKey = await api.createApiKey(newApiKeyName, selectedConstellation, [managedNode.node_id]);
        setCreatedApiKey(apiKey);
      }

      // Move to instructions step
      setCurrentStep('instructions');
    } catch (err) {
      console.error('Error creating managed node:', err);
      setError('Failed to create managed node. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderConstellationStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Set Up Managed Node</DialogTitle>
        <DialogDescription>
          Select a constellation for your managed node. A constellation is a group of nodes that work together.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="node-name">Node Name</Label>
          <Input
            id="node-name"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            placeholder="Enter a name for your managed node"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="constellation">Constellation</Label>
          {constellationsQuery.isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading constellations...</span>
            </div>
          ) : constellationsQuery.error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to load constellations. Please try again.</AlertDescription>
            </Alert>
          ) : (
            <Select onValueChange={(value) => setSelectedConstellation(Number(value))}>
              <SelectTrigger id="constellation">
                <SelectValue placeholder="Select a constellation" />
              </SelectTrigger>
              <SelectContent>
                {constellationsQuery.data?.map((constellation) => (
                  <SelectItem key={constellation.id} value={constellation.id.toString()}>
                    {constellation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleNextStep} disabled={!selectedConstellation || !nodeName}>
          Next
        </Button>
      </DialogFooter>
    </>
  );

  const renderApiKeyStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>API Key Selection</DialogTitle>
        <DialogDescription>Select an existing API key or create a new one for your managed node.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <Tabs defaultValue="existing" onValueChange={(value) => setApiKeyOption(value as 'existing' | 'new')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Use Existing Key</TabsTrigger>
            <TabsTrigger value="new">Create New Key</TabsTrigger>
          </TabsList>

          <TabsContent value="existing">
            <div className="space-y-2">
              <Label htmlFor="api-key">Select API Key</Label>
              {apiKeysQuery.isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading API keys...</span>
                </div>
              ) : apiKeysQuery.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>Failed to load API keys. Please try again.</AlertDescription>
                </Alert>
              ) : apiKeysQuery.data && apiKeysQuery.data.length > 0 ? (
                <Select onValueChange={(value) => setSelectedApiKey(value)}>
                  <SelectTrigger id="api-key">
                    <SelectValue placeholder="Select an API key" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiKeysQuery.data.map((key) => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No API Keys</AlertTitle>
                  <AlertDescription>You don't have any API keys. Create a new one instead.</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="new">
            <div className="space-y-2">
              <Label htmlFor="new-api-key-name">API Key Name</Label>
              <Input
                id="new-api-key-name"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                placeholder="Enter a name for your new API key"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handlePreviousStep}>
          Back
        </Button>
        <Button
          onClick={handleNextStep}
          disabled={
            (apiKeyOption === 'existing' && !selectedApiKey && apiKeysQuery.data && apiKeysQuery.data.length > 0) ||
            (apiKeyOption === 'new' && !newApiKeyName)
          }
        >
          Next
        </Button>
      </DialogFooter>
    </>
  );

  const renderInstructionsStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Setup Complete</DialogTitle>
        <DialogDescription>
          Your managed node has been set up successfully. Follow these instructions to configure your bot.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Node Setup Complete</AlertTitle>
          <AlertDescription>Your node has been successfully set up as a managed node.</AlertDescription>
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
            <h4 className="text-md font-medium">Your API Key:</h4>
            <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-sm">
              {createdApiKey ? createdApiKey.key : 'Use your selected API key'}
            </div>
          </div>

          <div className="mt-4">
            <Button className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Download Bot Software
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={() => navigate(`/nodes/${node.node_id}`)}>Go to Node Details</Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p>Setting up your managed node...</p>
          </div>
        ) : currentStep === 'constellation' ? (
          renderConstellationStep()
        ) : currentStep === 'api-key' ? (
          renderApiKeyStep()
        ) : (
          renderInstructionsStep()
        )}
      </DialogContent>
    </Dialog>
  );
}
