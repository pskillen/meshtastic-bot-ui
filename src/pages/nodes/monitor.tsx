import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNodeWatches } from '@/hooks/api/useNodeWatches';
import { NodesMap } from '@/components/nodes/NodesMap';
import { WatchedNodesTable } from '@/components/nodes/WatchedNodesTable';
import { MonitoredNodesBatteryChart } from '@/components/nodes/MonitoredNodesBatteryChart';
import { MonitoredNodesChannelUtilChart } from '@/components/nodes/MonitoredNodesChannelUtilChart';
import { TracerouteDetailModal } from '@/pages/traceroutes/TracerouteDetailModal';
import { Button } from '@/components/ui/button';
import { RouteIcon } from 'lucide-react';
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
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Mesh watches</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Status for nodes you are watching via mesh monitoring (server-backed).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/nodes/my-nodes">My Nodes</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/nodes/infrastructure">Mesh Infrastructure</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/traceroutes" className="inline-flex items-center gap-1.5">
              <RouteIcon className="h-4 w-4" aria-hidden />
              Traceroutes
            </Link>
          </Button>
        </div>
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
            <MonitoredNodesBatteryChart nodes={nodesForCharts} />
          </div>

          <div className="bg-background rounded-lg border">
            <MonitoredNodesChannelUtilChart nodes={nodesForCharts} />
          </div>

          <div className="bg-background rounded-lg border">
            <WatchedNodesTable
              watches={watches}
              watchesQuery={watchesQuery}
              onOpenTraceroute={setSelectedTracerouteId}
            />
          </div>
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
