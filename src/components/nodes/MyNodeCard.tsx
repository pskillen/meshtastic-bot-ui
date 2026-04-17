import { Link } from 'react-router-dom';
import { formatDistanceToNow, subDays } from 'date-fns';
import { MoreVertical, Radio, Settings, ChevronRight, FileText } from 'lucide-react';
import type { UseQueryResult } from '@tanstack/react-query';

import { MeshWatchControls } from '@/components/nodes/MeshWatchControls';
import { BatteryGauge } from '@/components/nodes/BatteryGauge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ObservedNode, NodeWatch, PaginatedResponse } from '@/lib/models';

const POSITION_STALE_DAYS = 7;

function getPositionHint(node: ObservedNode): string {
  const pos = node.latest_position as {
    latitude?: number;
    longitude?: number;
    reported_time?: Date | string;
  } | null;
  if (!pos) return 'No fix';
  const lat = pos.latitude;
  const lon = pos.longitude;
  if (lat == null || lon == null || lat === 0 || lon === 0) return 'No fix';
  const reported = pos.reported_time ? new Date(pos.reported_time) : null;
  if (!reported) return 'Has fix';
  const cutoff = subDays(new Date(), POSITION_STALE_DAYS);
  return reported >= cutoff ? 'Recent fix' : 'Stale fix';
}

export interface MyNodeCardProps {
  node: ObservedNode;
  isManaged: boolean;
  isClaimed: boolean;
  watch: NodeWatch | undefined;
  watchesQuery: Pick<UseQueryResult<PaginatedResponse<NodeWatch>>, 'isLoading' | 'isError'>;
  onConvert: () => void;
  onShowSetupInstructions: () => void;
}

export function MyNodeCard({
  node,
  isManaged,
  isClaimed,
  watch,
  watchesQuery,
  onConvert,
  onShowSetupInstructions,
}: MyNodeCardProps) {
  const metrics = node.latest_device_metrics;
  const batteryLevel = metrics?.battery_level != null ? metrics.battery_level : null;
  const voltage = metrics?.voltage != null ? metrics.voltage : null;
  const metricsReported = metrics?.reported_time ? new Date(metrics.reported_time) : null;
  const positionHint = getPositionHint(node);
  const displayName = node.short_name || node.node_id_str;

  return (
    <Card className="min-w-0 flex flex-col h-full border bg-card shadow-sm">
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-tight truncate">{displayName}</h2>
            {node.long_name ? <p className="text-sm text-muted-foreground truncate mt-0.5">{node.long_name}</p> : null}
            <p className="text-xs font-mono text-muted-foreground mt-1 truncate">{node.node_id_str}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label={`More actions for ${displayName}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {!isManaged ? (
                <DropdownMenuItem onSelect={() => onConvert()}>
                  <Radio className="mr-2 h-4 w-4" />
                  Convert to managed
                </DropdownMenuItem>
              ) : null}
              {isManaged ? (
                <DropdownMenuItem onSelect={() => onShowSetupInstructions()}>
                  <FileText className="mr-2 h-4 w-4" />
                  Setup instructions
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pt-0">
        <div className="flex flex-wrap gap-1.5">
          {isManaged ? (
            <Badge variant="outline" className="text-xs">
              Managed
            </Badge>
          ) : null}
          {isClaimed ? (
            <Badge variant="outline" className="text-xs">
              Claimed
            </Badge>
          ) : null}
          <Badge variant="secondary" className="text-xs">
            {positionHint}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Last heard{' '}
          <span className="text-foreground tabular-nums">
            {node.last_heard ? formatDistanceToNow(new Date(node.last_heard), { addSuffix: true }) : 'never'}
          </span>
        </p>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">
                <BatteryGauge batteryLevel={batteryLevel} voltage={voltage} />
              </div>
            </TooltipTrigger>
            {metricsReported ? (
              <TooltipContent side="bottom" className="max-w-xs">
                Metrics updated {formatDistanceToNow(metricsReported, { addSuffix: true })}
              </TooltipContent>
            ) : (
              <TooltipContent side="bottom">No recent telemetry timestamp</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 border-t pt-4 mt-auto">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Mesh monitoring</p>
          <MeshWatchControls
            node={node}
            watch={watch}
            watchesQuery={watchesQuery}
            idPrefix={`my-nodes-card-${node.node_id}`}
            compact
          />
        </div>
        <Button asChild className="w-full">
          <Link to={`/nodes/${node.node_id}`} className="inline-flex items-center justify-center gap-1.5">
            <Settings className="h-4 w-4 shrink-0" aria-hidden />
            Node details
            <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
