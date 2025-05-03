import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageList } from '@/components/messages/MessageList';
import { NodeSearch } from '@/components/NodeSearch';
import { useConfig } from '@/providers/ConfigProvider';
import { MeshtasticApi } from '@/lib/api/meshtastic';
import { Constellation, MessageChannel } from '@/lib/models';

export function MessageHistory() {
  const config = useConfig();
  const api = useMemo(() => new MeshtasticApi(config.apis.meshBot), [config.apis.meshBot]);

  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const [channels, setChannels] = useState<MessageChannel[]>([]);
  const [selectedConstellation, setSelectedConstellation] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>('channels');
  const [loadingConstellations, setLoadingConstellations] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch constellations on mount
  useEffect(() => {
    setLoadingConstellations(true);
    api
      .getConstellations()
      .then((data) => {
        setConstellations(data);
        if (data.length > 0) {
          setSelectedConstellation(data[0].id);
        }
      })
      .catch(() => setError('Failed to load constellations'))
      .finally(() => setLoadingConstellations(false));
  }, [api]);

  // Fetch channels when constellation changes
  useEffect(() => {
    if (selectedConstellation == null) {
      setChannels([]);
      setSelectedChannel(null);
      return;
    }
    setLoadingChannels(true);
    api
      .getConstellationChannels(selectedConstellation)
      .then((data) => {
        setChannels(data);
        setSelectedChannel(data.length > 0 ? data[0].id : null);
      })
      .catch(() => setError('Failed to load channels'))
      .finally(() => setLoadingChannels(false));
  }, [selectedConstellation, api]);

  // Handle constellation selection
  const handleConstellationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedConstellation(Number(e.target.value));
    setSelectedChannel(null);
    setSelectedNodeId(undefined);
    setActiveTab('channels');
  };

  // Handle channel selection
  const handleChannelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChannel(Number(e.target.value));
    setSelectedNodeId(undefined);
    setActiveTab('channels');
  };

  // Handle node selection from search
  const handleNodeSelect = (nodeId: number) => {
    setSelectedNodeId(nodeId);
    setActiveTab('nodes');
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="nodes">By Node</TabsTrigger>
            </TabsList>

            <TabsContent value="channels">
              <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
                {/* Constellation selector */}
                <div>
                  <label htmlFor="constellation-select" className="mr-2 font-medium">
                    Constellation:
                  </label>
                  <select
                    id="constellation-select"
                    value={selectedConstellation ?? ''}
                    onChange={handleConstellationSelect}
                    disabled={loadingConstellations || constellations.length === 0}
                    className="border rounded px-2 py-1"
                  >
                    {constellations.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Channel selector */}
                <div>
                  <label htmlFor="channel-select" className="mr-2 font-medium">
                    Channel:
                  </label>
                  <select
                    id="channel-select"
                    value={selectedChannel ?? ''}
                    onChange={handleChannelSelect}
                    disabled={loadingChannels || channels.length === 0}
                    className="border rounded px-2 py-1"
                  >
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {error && <div className="text-red-500 mb-2">{error}</div>}
              {activeTab === 'channels' && selectedChannel && selectedConstellation && (
                <MessageList channel={selectedChannel} constellationId={selectedConstellation} />
              )}
              {!selectedChannel && !loadingChannels && (
                <div className="flex justify-center p-8">No channels available for this constellation.</div>
              )}
            </TabsContent>

            <TabsContent value="nodes">
              <div className="mb-4">
                <NodeSearch onNodeSelect={handleNodeSelect} />
                {selectedNodeId && activeTab === 'nodes' ? (
                  <MessageList nodeId={selectedNodeId} />
                ) : (
                  <div className="flex justify-center p-8">Search for a node to view its messages</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
