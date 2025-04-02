import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NodeMap() {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Node Map</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Interactive map showing node locations and connections will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
