import { useState } from 'react';
import { MeshWatchControls } from '@/components/nodes/MeshWatchControls';
import { NodeMeshMonitoringSettingsDialog } from '@/components/nodes/NodeMeshMonitoringSettingsDialog';
import { useMonitoringOfflineAfter, useNodeWatches } from '@/hooks/api/useNodeWatches';
import type { ObservedNode } from '@/lib/models';
import { authService } from '@/lib/auth/authService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Settings } from 'lucide-react';

function formatSilenceSummary(seconds: number): string {
  if (seconds % 3600 === 0) return `${seconds / 3600} hour${seconds === 3600 ? '' : 's'}`;
  if (seconds % 60 === 0) return `${seconds / 60} minutes`;
  return `${seconds.toLocaleString()} seconds`;
}

export function NodeMeshMonitoringSection({ node }: { node: ObservedNode }) {
  const currentUser = authService.getCurrentUser();
  const watchesQuery = useNodeWatches();
  const observedUuid = String(node.internal_id);
  const offlineAfterQuery = useMonitoringOfflineAfter(observedUuid, Boolean(currentUser));
  const [settingsOpen, setSettingsOpen] = useState(false);

  const watch = watchesQuery.data?.results.find((w) => w.observed_node.node_id_str === node.node_id_str);

  if (!currentUser) {
    return null;
  }

  const currentSeconds = offlineAfterQuery.data?.offline_after;
  const canEditThreshold = offlineAfterQuery.data?.editable ?? false;

  return (
    <div className="mb-6">
      <Card>
        <CardHeader className="space-y-0">
          <div className="flex flex-row items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle>Mesh monitoring</CardTitle>
              <CardDescription>
                Get alerts when this node is quiet long enough that we run a verification traceroute round, then confirm
                offline if the mesh still cannot reach it. Discord notifications use your linked account settings.
              </CardDescription>
            </div>
            {canEditThreshold && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label="Mesh monitoring settings"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
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

          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">Silence before verification</h3>
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
              <p className="text-sm text-muted-foreground">
                Current threshold:{' '}
                <span className="text-foreground font-medium">{formatSilenceSummary(currentSeconds)}</span> (
                {currentSeconds.toLocaleString()}s).
                {canEditThreshold ? ' Use the settings button above to change it.' : ''}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <NodeMeshMonitoringSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        observedNodeId={observedUuid}
        nodeId={node.node_id}
      />
    </div>
  );
}
