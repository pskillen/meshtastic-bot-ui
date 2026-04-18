import { useEffect, useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NodeSearch } from '@/components/NodeSearch';
import { NodesAndConstellationsMap, MapNode } from '@/components/nodes/NodesAndConstellationsMap';
import { ManagedNode, ObservedNode } from '@/lib/models';

export type TriggerMode = 'user' | 'auto';

interface TriggerTracerouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Initial mode when the dialog opens. The user can switch modes inside the dialog when no fixedTargetNode is set. */
  mode: TriggerMode;
  managedNodes: ManagedNode[];
  observedNodes: ObservedNode[];
  onTrigger: (managedNodeId: number, targetNodeId?: number) => Promise<void>;
  isSubmitting: boolean;
  /**
   * When set, the dialog is locked to user mode with the target fixed to this
   * ObservedNode. The picker/map is hidden, the mode toggle is hidden, and the
   * target row is read-only.
   */
  fixedTargetNode?: ObservedNode;
}

function formatNodeLabel(node: { short_name: string | null; node_id_str: string }): string {
  return `${node.short_name ?? node.node_id_str} (${node.node_id_str})`;
}

export function TriggerTracerouteModal({
  open,
  onOpenChange,
  mode: initialMode,
  managedNodes,
  observedNodes,
  onTrigger,
  isSubmitting,
  fixedTargetNode,
}: TriggerTracerouteModalProps) {
  const [mode, setMode] = useState<TriggerMode>(initialMode);
  const [managedNodeId, setManagedNodeId] = useState<number | null>(null);
  const [targetNodeId, setTargetNodeId] = useState<number | null>(null);
  const [targetNodeLabel, setTargetNodeLabel] = useState<string | null>(null);

  const hasFixedTarget = fixedTargetNode != null;

  // Reset mode when the dialog reopens or the initial mode prop changes.
  useEffect(() => {
    if (!open) return;
    setMode(hasFixedTarget ? 'user' : initialMode);
  }, [open, initialMode, hasFixedTarget]);

  useEffect(() => {
    if (!hasFixedTarget || !fixedTargetNode) return;
    setTargetNodeId(fixedTargetNode.node_id);
    setTargetNodeLabel(formatNodeLabel(fixedTargetNode));
  }, [hasFixedTarget, fixedTargetNode]);

  const handleSubmit = async () => {
    if (!managedNodeId) return;
    if (mode === 'user' && !targetNodeId) return;
    await onTrigger(managedNodeId, mode === 'user' ? (targetNodeId ?? undefined) : undefined);
    setManagedNodeId(null);
    if (!hasFixedTarget) {
      setTargetNodeId(null);
      setTargetNodeLabel(null);
    }
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

  // In the fixed-target variant, clicking a managed marker picks it as source.
  // Clicking anything else (e.g. the fixed target itself) is a no-op.
  const handleFixedTargetMapNodeSelect = (node: MapNode | null) => {
    if (!node) return false;
    const isManaged = managedNodes.some((m) => m.node_id === node.node_id);
    if (!isManaged) return false;
    setManagedNodeId(node.node_id);
    return true;
  };

  const dialogDescription =
    mode === 'auto'
      ? 'Select the source node. The target will be auto-selected (most recently heard).'
      : hasFixedTarget
        ? 'Select the source node. The target is fixed to the node you are viewing.'
        : 'Select the source node and target node for the traceroute.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={mode === 'user' ? 'max-w-4xl' : undefined}>
        <DialogHeader>
          <DialogTitle>Trigger Traceroute</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        {!hasFixedTarget && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as TriggerMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">Pick target</TabsTrigger>
              <TabsTrigger value="auto">Auto target</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

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

          {mode === 'user' && hasFixedTarget && fixedTargetNode && (
            <>
              <div className="grid gap-2">
                <Label>Target node</Label>
                <div
                  className="rounded-md border bg-muted/40 px-3 py-2 text-sm"
                  data-testid="trigger-traceroute-fixed-target"
                >
                  {formatNodeLabel(fixedTargetNode)}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Pick a source on the map</Label>
                <p className="text-xs text-muted-foreground">
                  Target is highlighted. Click an available source to select it.
                </p>
                <div className="h-[300px] rounded-md border overflow-hidden">
                  <NodesAndConstellationsMap
                    managedNodes={managedNodes}
                    observedNodes={[fixedTargetNode]}
                    showConstellation={true}
                    showUnmanagedNodes={true}
                    drawBoundingBox={false}
                    enableBubbles={false}
                    selectedNodeId={managedNodeId ?? fixedTargetNode.node_id}
                    onNodeSelect={handleFixedTargetMapNodeSelect}
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'user' && !hasFixedTarget && (
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
