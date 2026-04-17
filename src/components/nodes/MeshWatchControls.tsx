import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { ObservedNode, NodeWatch, PaginatedResponse } from '@/lib/models';
import {
  useCreateNodeWatchMutation,
  usePatchNodeWatchMutation,
  useDeleteNodeWatchMutation,
} from '@/hooks/api/useNodeWatches';
import type { UseQueryResult } from '@tanstack/react-query';
import { authService } from '@/lib/auth/authService';
import { userCanMeshWatchNode } from '@/lib/meshtastic';

export interface MeshWatchControlsProps {
  node: ObservedNode;
  watch: NodeWatch | undefined;
  watchesQuery: Pick<UseQueryResult<PaginatedResponse<NodeWatch>>, 'isLoading' | 'isError'>;
  /** Unique prefix for checkbox ids (e.g. page + node id) */
  idPrefix: string;
  /** Slightly tighter spacing for cards */
  compact?: boolean;
}

/**
 * Add / enable / remove mesh monitoring watch for an observed node (My Nodes, Infrastructure, etc.).
 */
export function MeshWatchControls({ node, watch, watchesQuery, idPrefix, compact }: MeshWatchControlsProps) {
  const createWatch = useCreateNodeWatchMutation();
  const patchWatch = usePatchNodeWatchMutation();
  const deleteWatch = useDeleteNodeWatchMutation();

  const gapClass = compact ? 'gap-1.5' : 'gap-2';
  const maxW = compact ? 'max-w-none' : 'max-w-[200px]';

  if (watchesQuery.isLoading) {
    return <span className="text-muted-foreground text-sm">…</span>;
  }
  if (watchesQuery.isError) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const currentUser = authService.getCurrentUser();
  const canAddWatch = userCanMeshWatchNode(node, currentUser?.id);

  if (!watch && !canAddWatch) {
    return (
      <p className="text-sm text-muted-foreground max-w-md">
        Watches are only available for nodes you have claimed or for shared infrastructure roles (router, repeater,
        etc.).
      </p>
    );
  }

  if (watch) {
    return (
      <div className={`flex flex-col ${gapClass} ${maxW}`}>
        <div className={`flex items-center ${gapClass}`}>
          <Checkbox
            id={`${idPrefix}-enabled`}
            checked={watch.enabled}
            disabled={patchWatch.isPending}
            onCheckedChange={(checked) => {
              if (checked === 'indeterminate') return;
              patchWatch.mutate(
                { id: watch.id, enabled: Boolean(checked) },
                {
                  onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not update watch'),
                }
              );
            }}
          />
          <label htmlFor={`${idPrefix}-enabled`} className="text-sm cursor-pointer">
            Alerts on
          </label>
        </div>
        <div className="flex flex-wrap gap-1">
          {watch.observed_node.monitoring_verification_started_at && (
            <Badge variant="secondary" className="text-xs">
              Verifying
            </Badge>
          )}
          {watch.observed_node.monitoring_offline_confirmed_at && (
            <Badge variant="destructive" className="text-xs">
              Offline
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 px-2 text-xs text-muted-foreground ${compact ? 'self-start' : ''}`}
          disabled={deleteWatch.isPending}
          onClick={() =>
            deleteWatch.mutate(watch.id, {
              onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not remove watch'),
            })
          }
        >
          {deleteWatch.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
              Removing…
            </>
          ) : (
            'Remove watch'
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="text-xs"
      disabled={createWatch.isPending}
      onClick={() =>
        createWatch.mutate(
          { observed_node_id: String(node.internal_id), enabled: true },
          {
            onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not add watch'),
          }
        )
      }
    >
      {createWatch.isPending ? (
        <>
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
          Adding…
        </>
      ) : (
        'Add watch'
      )}
    </Button>
  );
}
