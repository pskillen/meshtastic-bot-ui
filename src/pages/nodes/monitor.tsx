import { useNodes } from '@/lib/hooks/useNodes';
import { useMonitoredNodes } from '@/hooks/useMonitoredNodes';
import { NodesMap } from '@/components/nodes/NodesMap';
import { MonitoredNodesTable } from '@/components/nodes/MonitoredNodesTable';
import { MonitoredNodesBatteryChart } from '@/components/nodes/MonitoredNodesBatteryChart';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NodeSelector } from '@/components/nodes/NodeSelector';
import { useState } from 'react';
import { NodeData } from '@/lib/models';

export default function MonitorNodesPage() {
  const [isAddingNode, setIsAddingNode] = useState(false);
  const { nodes, isLoading } = useNodes();
  const { monitoredNodeIds, addNode, removeNode } = useMonitoredNodes();

  // Filter nodes to only show monitored ones
  const monitoredNodes = nodes?.filter((node: NodeData) => monitoredNodeIds.includes(node.node_id)) || [];

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Monitor Nodes</h1>
        <Button onClick={() => setIsAddingNode(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Node
        </Button>
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

      {monitoredNodes.length > 0 ? (
        <>
          <div className="h-[400px] bg-background rounded-lg border">
            <NodesMap nodes={monitoredNodes} />
          </div>

          <div className="bg-background rounded-lg border">
            <MonitoredNodesBatteryChart nodes={monitoredNodes} />
          </div>

          <div className="bg-background rounded-lg border">
            <MonitoredNodesTable nodes={monitoredNodes} onRemoveNode={removeNode} />
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-background rounded-lg border">
          <h3 className="text-lg font-medium">No nodes being monitored</h3>
          <p className="text-muted-foreground mt-2">Add nodes to monitor their status and metrics</p>
        </div>
      )}
    </div>
  );
}
