import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNodeWatches } from '@/hooks/api/useNodeWatches';
import { NodesMap } from '@/components/nodes/NodesMap';
import { WatchedNodesTable } from '@/components/nodes/WatchedNodesTable';
import { MonitoredNodesBatteryChart } from '@/components/nodes/MonitoredNodesBatteryChart';
import { MonitoredNodesChannelUtilChart } from '@/components/nodes/MonitoredNodesChannelUtilChart';
import { TracerouteDetailModal } from '@/pages/traceroutes/TracerouteDetailModal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { NodeWatch, ObservedNode } from '@/lib/models';

function nodeFromWatch(watch: NodeWatch): ObservedNode {
  return watch.observed_node as unknown as ObservedNode;
}

export default function MonitorNodesPage() {
  const watchesQuery = useNodeWatches();
  const [selectedTracerouteId, setSelectedTracerouteId] = useState<number | null>(null);

  const watches = watchesQuery.data?.results ?? [];
  const nodesForCharts = useMemo(() => (watchesQuery.data?.results ?? []).map(nodeFromWatch), [watchesQuery.data]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mesh watches</h1>
        <p className="text-sm text-muted-foreground mt-1">
          You are explicitly monitoring these nodes for mesh connectivity.
        </p>
      </div>

      {watchesQuery.isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      )}

      {watchesQuery.isError && (
        <div className="text-center py-12 rounded-lg border border-destructive/50 text-destructive">
          Could not load watches. Try again later.
        </div>
      )}

      {!watchesQuery.isLoading && !watchesQuery.isError && watches.length === 0 && (
        <div className="text-center py-12 bg-background rounded-lg border">
          <h3 className="text-lg font-medium">No watches yet</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Add a mesh monitoring watch from{' '}
            <Link to="/nodes/my-nodes" className="text-teal-600 dark:text-teal-400 hover:underline">
              My Nodes
            </Link>{' '}
            or{' '}
            <Link to="/nodes/infrastructure" className="text-teal-600 dark:text-teal-400 hover:underline">
              Mesh Infrastructure
            </Link>{' '}
            to see alerts and status here.
          </p>
        </div>
      )}

      {!watchesQuery.isLoading && !watchesQuery.isError && watches.length > 0 && (
        <>
          <div className="h-[400px] bg-background rounded-lg border">
            <NodesMap nodes={nodesForCharts} />
          </div>

          <div className="bg-background rounded-lg border">
            <WatchedNodesTable
              watches={watches}
              watchesQuery={watchesQuery}
              onOpenTraceroute={setSelectedTracerouteId}
            />
          </div>

          <div className="bg-background rounded-lg border">
            <MonitoredNodesBatteryChart nodes={nodesForCharts} />
          </div>

          <Accordion type="single" collapsible className="bg-background rounded-lg border px-2">
            <AccordionItem value="channel-util" className="border-0">
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                Channel utilization
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-0">
                <MonitoredNodesChannelUtilChart nodes={nodesForCharts} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}

      <TracerouteDetailModal
        tracerouteId={selectedTracerouteId}
        open={selectedTracerouteId != null}
        onOpenChange={(open) => !open && setSelectedTracerouteId(null)}
      />
    </div>
  );
}
