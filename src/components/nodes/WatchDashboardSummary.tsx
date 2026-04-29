import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NodeWatch } from '@/lib/models';
import {
  deriveWatchMonitoringStatus,
  WATCH_STATUS_LABEL,
  type WatchMonitoringStatus,
} from '@/lib/watch-monitoring-status';

const SUMMARY_ORDER: WatchMonitoringStatus[] = ['offline', 'verifying', 'battery_low', 'unknown', 'online'];

export interface WatchDashboardSummaryProps {
  watches: NodeWatch[];
  counts: Record<WatchMonitoringStatus, number>;
  onJumpToWatch: (watchId: number) => void;
}

export function WatchDashboardSummary({ watches, counts, onJumpToWatch }: WatchDashboardSummaryProps) {
  return (
    <div className="bg-background rounded-lg border p-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {SUMMARY_ORDER.map((s) => (
          <div key={s} className="rounded-md border bg-card/50 p-3 text-center">
            <div className="text-2xl font-semibold tabular-nums">{counts[s]}</div>
            <div className="text-xs text-muted-foreground">{WATCH_STATUS_LABEL[s]}</div>
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-sm font-medium mb-2">Jump to watch</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {watches.map((w) => {
            const n = w.observed_node;
            const st = deriveWatchMonitoringStatus(w);
            return (
              <Button
                key={w.id}
                type="button"
                variant="outline"
                className="h-auto min-h-11 justify-start text-left py-2 px-3"
                onClick={() => onJumpToWatch(w.id)}
              >
                <span className="flex flex-col items-start gap-0.5 min-w-0">
                  <span className="font-medium truncate w-full">{n.short_name || n.node_id_str}</span>
                  <span className="text-xs text-muted-foreground font-mono">{n.node_id_str}</span>
                  <span
                    className={cn(
                      'text-xs',
                      st === 'offline' && 'text-destructive font-medium',
                      st === 'battery_low' && 'text-amber-700 dark:text-amber-400 font-medium'
                    )}
                  >
                    {WATCH_STATUS_LABEL[st]}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
