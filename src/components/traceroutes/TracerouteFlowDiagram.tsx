import { Badge } from '@/components/ui/badge';
import { AutoTraceRoute, TracerouteRouteNode } from '@/lib/models';
import { ArrowRight } from 'lucide-react';

function NodeBadge({ node, isUnknown }: { node: TracerouteRouteNode; isUnknown: boolean }) {
  const label = node.short_name ?? node.node_id_str;
  return (
    <Badge
      variant={isUnknown ? 'outline' : 'secondary'}
      className={isUnknown ? 'border-dashed font-mono text-muted-foreground' : ''}
    >
      {label}
      {node.snr != null && !isUnknown && <span className="ml-1 text-xs opacity-75">({node.snr})</span>}
    </Badge>
  );
}

function FlowRow({
  startLabel,
  nodes,
  endLabel,
  directionColor,
}: {
  startLabel: string;
  nodes: TracerouteRouteNode[];
  endLabel: string;
  directionColor: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge className={directionColor}>{startLabel}</Badge>
      {nodes.map((node, i) => (
        <span key={`${node.node_id}-${i}`} className="flex items-center gap-1">
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          <NodeBadge node={node} isUnknown={node.node_id === 0xffffffff || !node.position} />
        </span>
      ))}
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Badge className={directionColor}>{endLabel}</Badge>
    </div>
  );
}

export function TracerouteFlowDiagram({ traceroute }: { traceroute: AutoTraceRoute }) {
  const routeNodes = traceroute.route_nodes ?? [];
  const routeBackNodes = traceroute.route_back_nodes ?? [];
  const sourceLabel = traceroute.source_node?.short_name ?? traceroute.source_node?.node_id_str ?? 'Source';
  const targetLabel = traceroute.target_node?.short_name ?? traceroute.target_node?.node_id_str ?? 'Target';

  if (routeNodes.length === 0 && routeBackNodes.length === 0) {
    if (traceroute.status !== 'completed') {
      return null;
    }
    return (
      <div className="space-y-2 rounded-md border border-blue-500/25 bg-blue-500/5 px-3 py-3 dark:border-blue-400/30 dark:bg-blue-950/40">
        <p className="text-sm text-muted-foreground">No intermediate relays — direct RF path.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">{sourceLabel}</Badge>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">{targetLabel}</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Outbound</h4>
        <FlowRow
          startLabel={sourceLabel}
          nodes={routeNodes}
          endLabel={targetLabel}
          directionColor="bg-blue-500/20 text-blue-700 dark:text-blue-300"
        />
      </div>
      {routeBackNodes.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Return</h4>
          <FlowRow
            startLabel={targetLabel}
            nodes={routeBackNodes}
            endLabel={sourceLabel}
            directionColor="bg-green-500/20 text-green-700 dark:text-green-300"
          />
        </div>
      )}
    </div>
  );
}
