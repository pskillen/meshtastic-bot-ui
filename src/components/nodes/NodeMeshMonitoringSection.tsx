import { MeshWatchControls } from '@/components/nodes/MeshWatchControls';
import {
  useMonitoringOfflineAfter,
  useNodeWatches,
  usePatchMonitoringOfflineAfterMutation,
} from '@/hooks/api/useNodeWatches';
import type { ObservedNode } from '@/lib/models';
import { authService } from '@/lib/auth/authService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SILENCE_PRESETS: { label: string; seconds: number }[] = [
  { label: '1 hour', seconds: 3600 },
  { label: '2 hours', seconds: 7200 },
  { label: '6 hours', seconds: 21600 },
  { label: '12 hours', seconds: 43200 },
  { label: '24 hours', seconds: 86400 },
];

export function NodeMeshMonitoringSection({ node }: { node: ObservedNode }) {
  const currentUser = authService.getCurrentUser();
  const watchesQuery = useNodeWatches();
  const observedUuid = String(node.internal_id);
  const offlineAfterQuery = useMonitoringOfflineAfter(observedUuid, Boolean(currentUser));
  const patchOfflineAfter = usePatchMonitoringOfflineAfterMutation();

  const watch = watchesQuery.data?.results.find((w) => w.observed_node.node_id_str === node.node_id_str);

  if (!currentUser) {
    return null;
  }

  const currentSeconds = offlineAfterQuery.data?.offline_after;
  const editable = offlineAfterQuery.data?.editable ?? false;
  const presetValues = new Set(SILENCE_PRESETS.map((p) => p.seconds));
  const selectValue =
    currentSeconds != null
      ? presetValues.has(currentSeconds)
        ? String(currentSeconds)
        : `custom:${currentSeconds}`
      : '';

  return (
    <div className="mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Mesh monitoring</CardTitle>
          <CardDescription>
            Get alerts when this node is quiet long enough that we run a verification traceroute round, then confirm
            offline if the mesh still cannot reach it. Discord notifications use your linked account settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Your watch</h3>
            <MeshWatchControls
              node={node}
              watch={watch}
              watchesQuery={watchesQuery}
              idPrefix={`detail-${node.node_id}`}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Silence before verification</h3>
            <p className="text-sm text-muted-foreground">
              Consider the node silent if there are no packets for this long (based on last heard). Then monitoring may
              start a verification traceroute round.
            </p>
            {offlineAfterQuery.isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading threshold…
              </div>
            )}
            {offlineAfterQuery.isError && (
              <p className="text-sm text-muted-foreground">Could not load silence threshold.</p>
            )}
            {!offlineAfterQuery.isLoading && !offlineAfterQuery.isError && currentSeconds != null && (
              <>
                {editable ? (
                  <Select
                    value={selectValue}
                    disabled={patchOfflineAfter.isPending}
                    onValueChange={(v) => {
                      const sec = v.startsWith('custom:') ? parseInt(v.slice('custom:'.length), 10) : parseInt(v, 10);
                      if (!Number.isFinite(sec) || sec < 1) return;
                      patchOfflineAfter.mutate(
                        { observedNodeId: observedUuid, offline_after: sec, nodeId: node.node_id },
                        {
                          onError: (e) =>
                            toast.error(e instanceof Error ? e.message : 'Could not update silence threshold'),
                        }
                      );
                    }}
                  >
                    <SelectTrigger className="max-w-xs">
                      <SelectValue placeholder="Choose duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {SILENCE_PRESETS.map((p) => (
                        <SelectItem key={p.seconds} value={String(p.seconds)}>
                          {p.label} ({p.seconds.toLocaleString()}s)
                        </SelectItem>
                      ))}
                      {currentSeconds != null && !presetValues.has(currentSeconds) && (
                        <SelectItem value={`custom:${currentSeconds}`}>
                          Current: {currentSeconds.toLocaleString()}s
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Threshold: {currentSeconds.toLocaleString()} seconds (only the claim owner or staff can change
                    this.)
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
