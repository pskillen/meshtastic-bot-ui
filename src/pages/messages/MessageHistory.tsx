import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function MessageHistory() {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="channel1" className="w-full">
            <TabsList>
              <TabsTrigger value="channel1">Channel 1</TabsTrigger>
              <TabsTrigger value="channel2">Channel 2</TabsTrigger>
              <TabsTrigger value="channel3">Channel 3</TabsTrigger>
              <TabsTrigger value="channel4">Channel 4</TabsTrigger>
              <TabsTrigger value="channel5">Channel 5</TabsTrigger>
              <TabsTrigger value="channel6">Channel 6</TabsTrigger>
              <TabsTrigger value="channel7">Channel 7</TabsTrigger>
              <TabsTrigger value="channel8">Channel 8</TabsTrigger>
              <TabsTrigger value="direct">Direct Messages</TabsTrigger>
            </TabsList>
            <TabsContent value="channel1">
              <p>Messages from Channel 1 will be displayed here.</p>
            </TabsContent>
            <TabsContent value="channel2">
              <p>Messages from Channel 2 will be displayed here.</p>
            </TabsContent>
            <TabsContent value="channel3">
              <p>Messages from Channel 3 will be displayed here.</p>
            </TabsContent>
            <TabsContent value="channel4">
              <p>Messages from Channel 4 will be displayed here.</p>
            </TabsContent>
            <TabsContent value="channel5">
              <p>Messages from Channel 5 will be displayed here.</p>
            </TabsContent>
            <TabsContent value="channel6">
              <p>Messages from Channel 6 will be displayed here.</p>
            </TabsContent>
            <TabsContent value="channel7">
              <p>Messages from Channel 7 will be displayed here.</p>
            </TabsContent>
            <TabsContent value="channel8">
              <p>Messages from Channel 8 will be displayed here.</p>
            </TabsContent>
            <TabsContent value="direct">
              <p>Direct messages will be displayed here.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
