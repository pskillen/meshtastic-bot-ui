import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeshtasticApi } from '@/hooks/api/useApi';
import { NodeApiKey, ObservedNode, MessageChannel } from '@/lib/models';
import { useNodeSuspense } from '@/hooks/api/useNodes';
import { authService } from '@/lib/auth/authService';
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
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useConstellationsSuspense } from '@/hooks/api/useConstellations';

interface SetupManagedNodeProps {
  node: ObservedNode;
  isOpen: boolean;
  onClose: () => void;
}

type SetupStep = 'constellation' | 'location' | 'channels' | 'api-key' | 'instructions';

export function SetupManagedNode({ node, isOpen, onClose }: SetupManagedNodeProps) {
  const navigate = useNavigate();
  const api = useMeshtasticApi();

  // Glasgow coordinates as default fallback
  const GLASGOW_COORDS = { lat: 55.8642, lng: -4.2518 };

  const [currentStep, setCurrentStep] = useState<SetupStep>('constellation');
  const [selectedConstellation, setSelectedConstellation] = useState<number | null>(null);
  const [nodeName, setNodeName] = useState(node.short_name || node.node_id_str);
  const [apiKeyOption, setApiKeyOption] = useState<'existing' | 'new'>('existing');
  const [selectedApiKey, setSelectedApiKey] = useState<string | null>(null);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdApiKey, setCreatedApiKey] = useState<NodeApiKey | null>(null);

  // Location state
  const [nodeLocation, setNodeLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Channel mappings state
  const [channelMappings, setChannelMappings] = useState<{
    channel_0: number | null;
    channel_1: number | null;
    channel_2: number | null;
    channel_3: number | null;
    channel_4: number | null;
    channel_5: number | null;
    channel_6: number | null;
    channel_7: number | null;
  }>({
    channel_0: null,
    channel_1: null,
    channel_2: null,
    channel_3: null,
    channel_4: null,
    channel_5: null,
    channel_6: null,
    channel_7: null,
  });

  // Fetch constellations using the custom hook
  const { constellations } = useConstellationsSuspense();

  // Fetch API keys
  const apiKeysQuery = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.getApiKeys(),
  });

  // Get the node's observed node data to check for existing location
  const observedNode = useNodeSuspense(node.node_id);

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
      setCreatedApiKey(null);

      // Reset location and channel mappings
      setNodeLocation(null);
      setChannelMappings({
        channel_0: null,
        channel_1: null,
        channel_2: null,
        channel_3: null,
        channel_4: null,
        channel_5: null,
        channel_6: null,
        channel_7: null,
      });

      // Clean up map if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [isOpen, node]);

  const handleNextStep = () => {
    if (currentStep === 'constellation') {
      setCurrentStep('location');
    } else if (currentStep === 'location') {
      setCurrentStep('channels');
    } else if (currentStep === 'channels') {
      setCurrentStep('api-key');
    } else if (currentStep === 'api-key') {
      handleCreateManagedNode();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'location') {
      setCurrentStep('constellation');
    } else if (currentStep === 'channels') {
      setCurrentStep('location');
    } else if (currentStep === 'api-key') {
      setCurrentStep('channels');
    } else if (currentStep === 'instructions') {
      setCurrentStep('api-key');
    }
  };

  // Initialize map when location-channels step is active
  useEffect(() => {
    if (currentStep === 'location' && mapRef.current && !mapInstanceRef.current) {
      // Try to get location from observed node first
      let initialLocation = GLASGOW_COORDS; // Default to Glasgow

      if (observedNode?.latest_position?.latitude && observedNode?.latest_position?.longitude) {
        // Use observed node's location if available
        initialLocation = {
          lat: observedNode.latest_position.latitude,
          lng: observedNode.latest_position.longitude,
        };
        // Set the node location state
        setNodeLocation(initialLocation);
      }

      // Initialize the map
      const map = L.map(mapRef.current).setView([initialLocation.lat, initialLocation.lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Add a marker at the initial location
      const marker = L.marker([initialLocation.lat, initialLocation.lng], {
        draggable: true, // Allow the marker to be dragged
      }).addTo(map);

      // Update location when marker is dragged
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setNodeLocation({ lat: position.lat, lng: position.lng });
      });

      // Allow clicking on the map to move the marker
      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setNodeLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      // Store references
      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Fix: Invalidate map size after a short delay to ensure all tiles load
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      // Add CSS for map container
      const style = document.createElement('style');
      style.textContent = `
        .map-container {
          height: 300px;
          width: 100%;
          z-index: 1;
        }
      `;
      document.head.appendChild(style);

      return () => {
        style.remove();
      };
    }
  }, [currentStep, observedNode]);

  // Handle channel mapping changes
  const handleChannelChange = (channelIndex: number, channelId: number | null) => {
    setChannelMappings((prev) => ({
      ...prev,
      [`channel_${channelIndex}`]: channelId,
    }));
  };

  const handleCreateManagedNode = async () => {
    if (!selectedConstellation) {
      setError('Please select a constellation');
      return;
    }

    setIsLoading(true);
    setError(null);

    // current user id
    const user = authService.getCurrentUser();
    if (!user) {
      setError('Please login to create a managed node');
      setIsLoading(false);
      return;
    }

    try {
      // Create the managed node with location and channel mappings
      const managedNode = await api.createManagedNode(node.node_id, selectedConstellation, nodeName, user.id, {
        defaultLocationLatitude: nodeLocation?.lat,
        defaultLocationLongitude: nodeLocation?.lng,
        channels: channelMappings,
      });

      // Handle API key
      if (apiKeyOption === 'existing' && selectedApiKey) {
        // Add node to existing API key
        await api.addNodeToApiKey(selectedApiKey, managedNode.node_id);
      } else if (apiKeyOption === 'new' && newApiKeyName) {
        // Create new API key
        const apiKey = await api.createApiKey(newApiKeyName, selectedConstellation);
        setCreatedApiKey(apiKey);

        // Add node to new API key
        await api.addNodeToApiKey(apiKey.id, managedNode.node_id);
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

  // Find the selected constellation object
  const selectedConstellationObj =
    selectedConstellation != null ? constellations.find((c) => c.id === selectedConstellation) : null;
  const selectedConstellationChannels = selectedConstellationObj?.channels || [];

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
          <Select onValueChange={(value) => setSelectedConstellation(Number(value))}>
            <SelectTrigger id="constellation">
              <SelectValue placeholder="Select a constellation" />
            </SelectTrigger>
            <SelectContent>
              {constellations.map((constellation) => (
                <SelectItem key={constellation.id} value={constellation.id.toString()}>
                  {constellation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

  const renderLocationStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Node Location</DialogTitle>
        <DialogDescription>
          Set the default location for your node. Click on the map or drag the marker to set the location.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Node Location</Label>
          <p className="text-sm text-gray-500 mb-2">
            Click on the map or drag the marker to set the default location for your node.
            {observedNode?.latest_position
              ? " We've set the initial location based on the node's last reported position."
              : " We've set the initial location to Glasgow, Scotland."}
          </p>

          <div ref={mapRef} className="map-container border rounded-md" />

          {nodeLocation && (
            <div className="mt-2 text-sm">
              <p>
                Selected location: {nodeLocation.lat.toFixed(6)}, {nodeLocation.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handlePreviousStep}>
          Back
        </Button>
        <Button onClick={handleNextStep}>Next</Button>
      </DialogFooter>
    </>
  );

  const renderChannelsStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Channel Mappings</DialogTitle>
        <DialogDescription>Map your node's channels to known message channels in this constellation.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2 mt-4">
          <Label>Channel Mappings</Label>
          <p className="text-sm text-gray-500 mb-2">
            Map your node's channels to known message channels in this constellation.
          </p>

          {selectedConstellation && !selectedConstellationObj ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading channels...</span>
            </div>
          ) : selectedConstellationObj && selectedConstellationChannels.length > 0 ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((channelIndex) => (
                <div key={channelIndex} className="flex items-center space-x-2">
                  <Label htmlFor={`channel-${channelIndex}`} className="w-24">
                    Channel {channelIndex}:
                  </Label>
                  <Select
                    value={channelMappings[`channel_${channelIndex}` as keyof typeof channelMappings]?.toString() || ''}
                    onValueChange={(value) => handleChannelChange(channelIndex, value ? Number(value) : null)}
                  >
                    <SelectTrigger id={`channel-${channelIndex}`} className="flex-1">
                      <SelectValue placeholder="Select a channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedConstellationChannels.map((channel: MessageChannel) => (
                        <SelectItem key={channel.id} value={channel.id.toString()}>
                          {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Channels</AlertTitle>
              <AlertDescription>
                This constellation doesn't have any channels defined. You can continue without mapping channels.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handlePreviousStep}>
          Back
        </Button>
        <Button onClick={handleNextStep}>Next</Button>
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
                    {apiKeysQuery.data.map((key: NodeApiKey) => (
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
        ) : currentStep === 'location' ? (
          renderLocationStep()
        ) : currentStep === 'channels' ? (
          renderChannelsStep()
        ) : currentStep === 'api-key' ? (
          renderApiKeyStep()
        ) : (
          renderInstructionsStep()
        )}
      </DialogContent>
    </Dialog>
  );
}
