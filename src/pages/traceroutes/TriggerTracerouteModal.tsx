import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NodeSearch } from '@/components/NodeSearch';
import { NodesAndConstellationsMap, MapNode } from '@/components/nodes/NodesAndConstellationsMap';
import { ManagedNode, ObservedNode } from '@/lib/models';

interface TriggerTracerouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'user' | 'auto';
  managedNodes: ManagedNode[];
  observedNodes: ObservedNode[];
  onTrigger: (managedNodeId: number, targetNodeId?: number) => Promise<void>;
  isSubmitting: boolean;
}

export function TriggerTracerouteModal({
  open,
  onOpenChange,
  mode,
  managedNodes,
  observedNodes,
  onTrigger,
  isSubmitting,
}: TriggerTracerouteModalProps) {
  const [managedNodeId, setManagedNodeId] = useState<number | null>(null);
  const [targetNodeId, setTargetNodeId] = useState<number | null>(null);
  const [targetNodeLabel, setTargetNodeLabel] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!managedNodeId) return;
    if (mode === 'user' && !targetNodeId) return;
    await onTrigger(managedNodeId, mode === 'user' ? (targetNodeId ?? undefined) : undefined);
    setManagedNodeId(null);
    setTargetNodeId(null);
    setTargetNodeLabel(null);
  };

  const canSubmit = managedNodeId != null && (mode === 'auto' || targetNodeId != null);

  const handleMapNodeSelect = (node: MapNode | null) => {
    if (!node) {
      setTargetNodeId(null);
      setTargetNodeLabel(null);
      return false;
    }
    setTargetNodeId(node.node_id);
    setTargetNodeLabel(`${node.short_name ?? node.node_id_str} (${node.node_id_str})`);
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={mode === 'user' ? 'max-w-4xl' : undefined}>
        <DialogHeader>
          <DialogTitle>{mode === 'user' ? 'Trigger Traceroute (target)' : 'Trigger Traceroute (auto)'}</DialogTitle>
          <DialogDescription>
            {mode === 'user'
              ? 'Select the source node and target node for the traceroute.'
              : 'Select the source node. The target will be auto-selected (most recently heard).'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="managed-node">Source node</Label>
            <Select
              value={managedNodeId?.toString() ?? ''}
              onValueChange={(v) => setManagedNodeId(v ? parseInt(v, 10) : null)}
            >
              <SelectTrigger id="managed-node">
                <SelectValue placeholder="Select source node..." />
              </SelectTrigger>
              <SelectContent>
                {managedNodes.map((node) => (
                  <SelectItem key={node.node_id} value={node.node_id.toString()}>
                    {node.short_name ?? node.node_id_str} ({node.node_id_str})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === 'user' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="target-node">Target node</Label>
                <NodeSearch
                  onNodeSelect={(id, node) => {
                    setTargetNodeId(id);
                    setTargetNodeLabel(node ? `${node.short_name ?? node.node_id_str} (${node.node_id_str})` : null);
                  }}
                  displayValue={targetNodeId ? (targetNodeLabel ?? undefined) : null}
                  onClearSelection={() => {
                    setTargetNodeId(null);
                    setTargetNodeLabel(null);
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label>Or click on the map</Label>
                <div className="h-[300px] rounded-md border overflow-hidden">
                  <NodesAndConstellationsMap
                    managedNodes={managedNodes}
                    observedNodes={observedNodes}
                    showConstellation={true}
                    showUnmanagedNodes={true}
                    drawBoundingBox={false}
                    enableBubbles={false}
                    selectedNodeId={targetNodeId}
                    onNodeSelect={handleMapNodeSelect}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Triggering...' : 'Trigger'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
