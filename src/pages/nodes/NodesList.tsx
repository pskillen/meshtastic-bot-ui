import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function NodesList() {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          <p>List of all nodes in the network will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  )
} 