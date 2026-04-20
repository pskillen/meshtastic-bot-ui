/**
 * Full-screen dialog with a Leaflet map + imageOverlay for a completed RF propagation render.
 * Uses the same high z-index / min-height pattern as traceroute maps so tiles stack correctly in Radix Dialog.
 */
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RfPropagationMap } from '@/components/nodes/RfPropagationMap';
import { useRfPropagation } from '@/hooks/api/useRfPropagation';
import { isRfPropagationNone } from '@/lib/models';

export interface RfPropagationMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: number;
  shortLabel?: string | null;
}

export function RfPropagationMapModal({ open, onOpenChange, nodeId, shortLabel }: RfPropagationMapModalProps) {
  const { data, isLoading } = useRfPropagation(nodeId, { enabled: open });

  const ready = data && !isRfPropagationNone(data) && data.status === 'ready' ? data : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Propagation map{shortLabel ? ` — ${shortLabel}` : ''}</DialogTitle>
          <DialogDescription>Cached RF coverage preview when a render is available.</DialogDescription>
        </DialogHeader>
        <div className="min-h-[420px] w-full" style={{ position: 'relative', zIndex: 1 }}>
          {isLoading && (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground text-sm">Loading…</div>
          )}
          {!isLoading && !ready && (
            <div className="flex h-[400px] items-center justify-center rounded-md border bg-muted/30 text-muted-foreground text-sm">
              Map not rendered yet
            </div>
          )}
          {!isLoading && ready && (
            <RfPropagationMap assetUrl={ready.asset_url} bounds={ready.bounds ?? null} minHeight={400} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
