import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageList } from '@/components/messages/MessageList';
import { NodeSearch } from '@/components/NodeSearch';

export function MessageHistory() {
  const [selectedChannel, setSelectedChannel] = useState<number>(1);
  const [selectedNodeId, setSelectedNodeId] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>('channels');

  // Handle channel tab selection
  const handleChannelSelect = (value: string) => {
    const channelNum = parseInt(value.replace('channel', ''));
    setSelectedChannel(channelNum);
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
              <div className="mb-4">
                <Tabs defaultValue={`channel${selectedChannel}`} onValueChange={handleChannelSelect}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="channel0">Channel 1</TabsTrigger>
                    <TabsTrigger value="channel1">Channel 2</TabsTrigger>
                    <TabsTrigger value="channel2">Channel 3</TabsTrigger>
                    <TabsTrigger value="channel3">Channel 4</TabsTrigger>
                    <TabsTrigger value="channel4">Channel 5</TabsTrigger>
                    <TabsTrigger value="channel5">Channel 6</TabsTrigger>
                    <TabsTrigger value="channel6">Channel 7</TabsTrigger>
                    <TabsTrigger value="channel7">Channel 8</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {activeTab === 'channels' && <MessageList channel={selectedChannel} />}
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
