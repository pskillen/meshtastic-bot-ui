import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTraceroute } from '@/hooks/api/useTraceroutes';
import { TracerouteFlowDiagram } from '@/components/traceroutes/TracerouteFlowDiagram';
import { TracerouteMap } from '@/components/traceroutes/TracerouteMap';

function displayStatus(tr: { completed_at: string | null; status: string }): string {
  return tr.status;
}

interface TracerouteDetailModalProps {
  tracerouteId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TracerouteDetailModal({ tracerouteId, open, onOpenChange }: TracerouteDetailModalProps) {
  const { data: traceroute, isLoading, error } = useTraceroute(open ? tracerouteId : null);

  const isEmptyRouteArrays =
    traceroute &&
    (!traceroute.route || traceroute.route.length === 0) &&
    (!traceroute.route_back || traceroute.route_back.length === 0);
  const hasRouteData =
    traceroute &&
    ((traceroute.route_nodes && traceroute.route_nodes.length > 0) ||
      (traceroute.route_back_nodes && traceroute.route_back_nodes.length > 0) ||
      (traceroute.status === 'completed' && isEmptyRouteArrays));

  const hasSourceOrTargetPosition =
    traceroute &&
    (() => {
      const src = traceroute.source_node?.position;
      const tgt = traceroute.target_node?.latest_position;
      return (src?.latitude != null && src?.longitude != null) || (tgt?.latitude != null && tgt?.longitude != null);
    })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Traceroute Details</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {traceroute ? (
              <>
                <Link
                  to={`/nodes/${traceroute.source_node.node_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {traceroute.source_node?.short_name ?? traceroute.source_node?.node_id_str}
                </Link>
                <span aria-hidden>→</span>
                <Link
                  to={`/nodes/${traceroute.target_node.node_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {traceroute.target_node?.short_name ?? traceroute.target_node?.node_id_str}
                </Link>
              </>
            ) : (
              'Loading...'
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <div className="py-8 text-center text-muted-foreground">Loading traceroute...</div>}
        {error && (
          <div className="py-8 text-center text-destructive">
            Failed to load: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}
        {traceroute && !isLoading && !error && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <span className="text-muted-foreground">Source:</span>
                <Link
                  to={`/nodes/${traceroute.source_node.node_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {traceroute.source_node?.short_name ?? traceroute.source_node?.node_id_str}
                </Link>
              </Badge>
              <Badge variant="outline" className="gap-1">
                <span className="text-muted-foreground">Target:</span>
                <Link
                  to={`/nodes/${traceroute.target_node.node_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {traceroute.target_node?.short_name ?? traceroute.target_node?.node_id_str}
                </Link>
              </Badge>
              <Badge>{displayStatus(traceroute)}</Badge>
              <span className="text-sm text-muted-foreground">
                Triggered {traceroute.triggered_at ? format(new Date(traceroute.triggered_at), 'PPp') : '—'}
                {traceroute.completed_at &&
                  ` • ${traceroute.status === 'failed' ? 'Failed' : 'Completed'} ${format(new Date(traceroute.completed_at), 'PPp')}`}
              </span>
            </div>

            {hasRouteData && (
              <>
                <div>
                  <h3 className="mb-2 text-sm font-medium">Flow</h3>
                  <TracerouteFlowDiagram traceroute={traceroute} />
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">Map</h3>
                  <div className="h-[400px] overflow-hidden rounded-md border">
                    <TracerouteMap traceroute={traceroute} />
                  </div>
                </div>
              </>
            )}

            {hasSourceOrTargetPosition && !hasRouteData && (
              <div>
                <h3 className="mb-2 text-sm font-medium">Map</h3>
                <div className="h-[400px] overflow-hidden rounded-md border">
                  <TracerouteMap traceroute={traceroute} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {displayStatus(traceroute)} — showing known node positions
                </p>
              </div>
            )}

            {traceroute &&
              !hasRouteData &&
              !hasSourceOrTargetPosition &&
              traceroute.route === null &&
              traceroute.route_back === null && (
                <p className="text-sm text-muted-foreground">{displayStatus(traceroute)} — no route data yet</p>
              )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
