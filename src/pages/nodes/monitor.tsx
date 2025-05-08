import { useNodesSuspense } from '@/hooks/api/useNodes';
import { useMonitoredNodes } from '@/hooks/useMonitoredNodes';
import { NodesMap } from '@/components/nodes/NodesMap';
import { MonitoredNodesTable } from '@/components/nodes/MonitoredNodesTable';
import { MonitoredNodesBatteryChart } from '@/components/nodes/MonitoredNodesBatteryChart';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NodeSelector } from '@/components/nodes/NodeSelector';
import { useState, Suspense } from 'react';
import { ObservedNode } from '@/lib/models';
import { authService } from '@/lib/auth/authService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// View mode configuration for easy expansion
const VIEW_MODES = {
  monitored: {
    label: 'Monitored Nodes',
    editable: true,
    tableTitle: 'Monitored Nodes',
    tableDescription: 'List of nodes being actively monitored',
  },
  mine: {
    label: 'My Nodes',
    editable: false,
    tableTitle: 'My Nodes',
    tableDescription: 'List of nodes you own',
  },
  // Add more modes here as needed
} as const;

type ViewMode = keyof typeof VIEW_MODES;

function MonitorNodesPageContent() {
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('monitored');
  const { nodes } = useNodesSuspense();
  const { monitoredNodeIds, addNode, removeNode } = useMonitoredNodes();

  // Get current user ID
  const currentUser = authService.getCurrentUser();
  const currentUserId = currentUser?.id;

  // Filter nodes to only show monitored ones
  const monitoredNodes = nodes?.filter((node: ObservedNode) => monitoredNodeIds.includes(node.node_id)) || [];
  // Filter nodes to only show those owned by the current user
  const myNodes = nodes?.filter((node: ObservedNode) => node.owner?.id === currentUserId) || [];

  const nodesToDisplay = viewMode === 'monitored' ? monitoredNodes : myNodes;

  const { editable, tableTitle, tableDescription } = VIEW_MODES[viewMode];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Monitor Nodes</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VIEW_MODES).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAddingNode(true)} className="flex items-center gap-2" disabled={!editable}>
            <Plus className="w-4 h-4" />
            Add Node
          </Button>
        </div>
      </div>

      {isAddingNode && (
        <NodeSelector
          nodes={nodes || []}
          onSelect={(nodeId) => {
            addNode(nodeId);
            setIsAddingNode(false);
          }}
          onCancel={() => setIsAddingNode(false)}
          excludeNodes={monitoredNodeIds}
        />
      )}

      {nodesToDisplay.length > 0 ? (
        <>
          <div className="h-[400px] bg-background rounded-lg border">
            <NodesMap nodes={nodesToDisplay} />
          </div>

          <div className="bg-background rounded-lg border">
            <MonitoredNodesBatteryChart nodes={nodesToDisplay} />
          </div>

          <div className="bg-background rounded-lg border">
            <MonitoredNodesTable
              nodes={nodesToDisplay}
              onRemoveNode={removeNode}
              editable={editable}
              title={tableTitle}
              description={tableDescription}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-background rounded-lg border">
          <h3 className="text-lg font-medium">No nodes to display</h3>
          <p className="text-muted-foreground mt-2">
            {viewMode === 'monitored' ? 'Add nodes to monitor their status and metrics' : 'You do not own any nodes.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MonitorNodesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      }
    >
      <MonitorNodesPageContent />
    </Suspense>
  );
}
