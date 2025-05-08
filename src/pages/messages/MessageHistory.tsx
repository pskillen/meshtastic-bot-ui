import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageList } from '@/components/messages/MessageList';
import { NodeSearch } from '@/components/NodeSearch';
import { useConstellationsSuspense } from '@/hooks/api/useConstellations';
import type { MessageChannel } from '@/lib/models';

export function MessageHistory() {
  const { constellations } = useConstellationsSuspense();
  const [selectedConstellation, setSelectedConstellation] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>('channels');

  // Fetch constellations on mount
  useEffect(() => {
    if (constellations.length > 0 && selectedConstellation == null) {
      setSelectedConstellation(constellations[0].id);
    }
  }, [constellations, selectedConstellation]);

  // Get channels for the selected constellation (useMemo to avoid conditional hook call)
  const channels: MessageChannel[] = useMemo(() => {
    if (selectedConstellation) {
      const constellation = constellations.find((c) => c.id === selectedConstellation);
      return constellation?.channels ?? [];
    }
    return [];
  }, [selectedConstellation, constellations]);

  useEffect(() => {
    if (channels.length > 0 && selectedChannel == null) {
      setSelectedChannel(channels[0].id);
    }
  }, [channels, selectedChannel]);

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
                    disabled={constellations.length === 0}
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
                    disabled={channels.length === 0}
                    className="border rounded px-2 py-1"
                  >
                    {channels.map((ch: MessageChannel) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {activeTab === 'channels' && selectedChannel && selectedConstellation && (
                <MessageList channel={selectedChannel} constellationId={selectedConstellation} />
              )}
              {!selectedChannel && (
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
