import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Battery } from 'lucide-react';
import { ObservedNode } from '@/lib/models';
import { getRoleLabel } from '@/lib/meshtastic';
import { cn } from '@/lib/utils';

interface NodeCardProps {
  node: ObservedNode;
}

function getBatteryColor(level: number): string {
  if (level > 60) return 'text-emerald-500';
  if (level > 20) return 'text-amber-500';
  return 'text-red-500';
}

function getBatteryBarColor(level: number): string {
  if (level > 60) return 'bg-emerald-500';
  if (level > 20) return 'bg-amber-500';
  return 'bg-red-500';
}

function BatteryIndicator({ level }: { level: number }) {
  const pct = Math.min(100, Math.max(0, level));
  return (
    <div className="flex items-center gap-2 ml-auto">
      <div className="flex items-center gap-2 w-20">
        <div className="flex h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
          <div
            className={cn('h-full rounded-full transition-all', getBatteryBarColor(pct))}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground shrink-0">{pct}%</span>
      </div>
      <Battery className={cn('h-4 w-4 shrink-0', getBatteryColor(pct))} aria-hidden />
    </div>
  );
}

export function NodeCard({ node }: NodeCardProps) {
  const batteryLevel = node.latest_device_metrics?.battery_level ?? null;
  const roleLabel = getRoleLabel(node.role);

  return (
    <Link
      key={node.node_id}
      to={`/nodes/${node.node_id}`}
      className="block rounded-lg border-2 border-slate-400 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-600 dark:bg-slate-900"
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{node.short_name}</h2>
          {node.long_name && <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{node.long_name}</p>}
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {node.last_heard ? formatDistanceToNow(node.last_heard, { addSuffix: true }) : 'Never'}
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{node.node_id_str}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
        {roleLabel && <span>{roleLabel}</span>}
        {node.owner && <span>Owner: {node.owner.username}</span>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
        {node.hw_model && <span>{node.hw_model}</span>}
        {batteryLevel != null && <BatteryIndicator level={batteryLevel} />}
      </div>
    </Link>
  );
}
