import { PacketStatsChart } from '@/components/PacketStatsChart';
import { NodeActivityTable } from '@/components/NodeActivityTable';
import { useNodes } from '@/lib/hooks/useNodes';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NetworkIcon } from 'lucide-react';
import { ChartConfig } from '@/components/ui/chart';

const packetChartConfig = {
  value: {
    label: 'Packets',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function Dashboard() {
  const { nodes, isLoading } = useNodes();

  const onlineNodes =
    nodes?.filter((node) => {
      if (!node.last_heard) return false;
      const lastHeard = node.last_heard;
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      return lastHeard > twoHoursAgo;
    }) || [];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
        <Card className="@container/card">
          <CardHeader className="relative">
            <CardDescription>Online Nodes</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {isLoading ? '...' : onlineNodes.length}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                <NetworkIcon className="size-3" />
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">{onlineNodes.length} nodes active in last 2 hours</div>
            <div className="text-muted-foreground">{nodes?.length || 0} total nodes in network</div>
          </CardFooter>
        </Card>
      </div>
      <div className="px-4 lg:px-6">
        <PacketStatsChart title="Mesh Activity" description="Total packets per hour" config={packetChartConfig} />
      </div>
      <div className="px-4 lg:px-6">
        <NodeActivityTable nodes={nodes || []} isLoading={isLoading} />
      </div>
    </div>
  );
}
