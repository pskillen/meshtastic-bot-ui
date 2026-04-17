import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { useMonitoringOfflineAfter, usePatchMonitoringOfflineAfterMutation } from '@/hooks/api/useNodeWatches';
import { formatUptimeSeconds } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const SILENCE_PRESETS: { label: string; seconds: number }[] = [
  { label: '1 hour', seconds: 3600 },
  { label: '2 hours', seconds: 7200 },
  { label: '6 hours', seconds: 21600 },
  { label: '12 hours', seconds: 43200 },
  { label: '24 hours', seconds: 86400 },
];

export interface NodeMeshMonitoringSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  observedNodeId: string;
  nodeId: number;
}

/**
 * Admin-style silence threshold (NodePresence.offline_after). Parent should only open when the user can edit
 * (API `editable: true`); PATCH still enforces permissions server-side.
 */
export function NodeMeshMonitoringSettingsDialog({
  open,
  onOpenChange,
  observedNodeId,
  nodeId,
}: NodeMeshMonitoringSettingsDialogProps) {
  const offlineAfterQuery = useMonitoringOfflineAfter(observedNodeId, open);
  const patchOfflineAfter = usePatchMonitoringOfflineAfterMutation();
  const [seconds, setSeconds] = useState(21600);

  useEffect(() => {
    if (open && offlineAfterQuery.data?.offline_after != null) {
      setSeconds(offlineAfterQuery.data.offline_after);
    }
  }, [open, offlineAfterQuery.data?.offline_after]);

  const presetValues = new Set(SILENCE_PRESETS.map((p) => p.seconds));
  const selectValue = presetValues.has(seconds) ? String(seconds) : `custom:${seconds}`;
  const initialSeconds = offlineAfterQuery.data?.offline_after;
  const unchanged = initialSeconds != null && seconds === initialSeconds;

  const handleSave = () => {
    patchOfflineAfter.mutate(
      { observedNodeId, offline_after: seconds, nodeId },
      {
        onSuccess: () => {
          toast.success('Silence threshold saved');
          onOpenChange(false);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not save threshold'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mesh monitoring settings</DialogTitle>
          <DialogDescription>
            Silence before verification: how long the node can go without packets (last heard) before monitoring may
            start a verification traceroute round. Claim owners and staff can change this value.
          </DialogDescription>
        </DialogHeader>
        {offlineAfterQuery.isLoading && (
          <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading…
          </div>
        )}
        {offlineAfterQuery.isError && (
          <p className="text-sm text-destructive py-4">Could not load monitoring settings.</p>
        )}
        {!offlineAfterQuery.isLoading && !offlineAfterQuery.isError && offlineAfterQuery.data?.editable && (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="mesh-offline-after-trigger">Silence before verification</Label>
              <Select
                value={selectValue}
                onValueChange={(v) => {
                  const sec = v.startsWith('custom:') ? parseInt(v.slice('custom:'.length), 10) : parseInt(v, 10);
                  if (Number.isFinite(sec) && sec >= 1) setSeconds(sec);
                }}
              >
                <SelectTrigger id="mesh-offline-after-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SILENCE_PRESETS.map((p) => (
                    <SelectItem key={p.seconds} value={String(p.seconds)}>
                      {p.label}
                    </SelectItem>
                  ))}
                  {!presetValues.has(seconds) && (
                    <SelectItem value={`custom:${seconds}`}>Current: {formatUptimeSeconds(seconds)}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {offlineAfterQuery.data?.editable && (
            <Button type="button" onClick={handleSave} disabled={patchOfflineAfter.isPending || unchanged}>
              {patchOfflineAfter.isPending ? 'Saving…' : 'Save'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
