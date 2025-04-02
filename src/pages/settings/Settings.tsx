import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Settings() {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="homeNodeId">Home Node ID</Label>
            <Input id="homeNodeId" placeholder="Enter your home node ID" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel1Name">Channel 1 Name</Label>
            <Input id="channel1Name" placeholder="Enter Channel 1 name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel2Name">Channel 2 Name</Label>
            <Input id="channel2Name" placeholder="Enter Channel 2 name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel3Name">Channel 3 Name</Label>
            <Input id="channel3Name" placeholder="Enter Channel 3 name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel4Name">Channel 4 Name</Label>
            <Input id="channel4Name" placeholder="Enter Channel 4 name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel5Name">Channel 5 Name</Label>
            <Input id="channel5Name" placeholder="Enter Channel 5 name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel6Name">Channel 6 Name</Label>
            <Input id="channel6Name" placeholder="Enter Channel 6 name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel7Name">Channel 7 Name</Label>
            <Input id="channel7Name" placeholder="Enter Channel 7 name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel8Name">Channel 8 Name</Label>
            <Input id="channel8Name" placeholder="Enter Channel 8 name" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
