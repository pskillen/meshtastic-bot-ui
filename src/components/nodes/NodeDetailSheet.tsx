import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { NodeDetailContent } from './NodeDetailContent';
import { Suspense } from 'react';

interface NodeDetailSheetProps {
  nodeId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NodeDetailSheet({ nodeId, open, onOpenChange }: NodeDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Node Details</SheetTitle>
        </SheetHeader>
        {nodeId != null && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500" />
              </div>
            }
          >
            <NodeDetailContent nodeId={nodeId} compact />
          </Suspense>
        )}
      </SheetContent>
    </Sheet>
  );
}
