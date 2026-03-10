import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { DeviceMetrics, ObservedNode } from '@/lib/models';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { NodeMiniChart } from '@/components/nodes/NodeMiniChart';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

const ROLE_LABELS: Record<number, string> = {
  2: 'ROUTER',
  3: 'ROUTER_CLIENT',
  4: 'REPEATER',
  11: 'ROUTER_LATE',
  12: 'CLIENT_BASE',
};

interface InfrastructureNodeCardProps {
  node: ObservedNode;
  /** When provided with dateRange, shows a mini battery/channel chart */
  metrics?: DeviceMetrics[];
  dateRange?: { startDate: Date; endDate: Date };
  /** When true, this node is included in the comparison charts */
  compareSelected?: boolean;
  /** Called when the compare checkbox is toggled */
  onCompareToggle?: (newState: boolean) => void;
}

export function InfrastructureNodeCard({
  node,
  metrics,
  dateRange,
  onCompareToggle,
}: InfrastructureNodeCardProps) {
  const roleLabel = node.role != null ? (ROLE_LABELS[node.role] ?? `Role ${node.role}`) : null;
  const [compareSelected, setCompareSelected] = useState(false);

  return (
    <div className="flex flex-col h-full p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{node.short_name}</h2>
          <p className="text-slate-600 dark:text-slate-400">{node.long_name}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {onCompareToggle != null && (
            <div className="flex items-center gap-1.5">
              <Checkbox
                id={`compare-${node.node_id}`}
                checked={compareSelected}
                onCheckedChange={() => {
                  const newState = !compareSelected;
                  setCompareSelected(newState); 
                  if (onCompareToggle) onCompareToggle(newState);
                }}
              />
              <label
                htmlFor={`compare-${node.node_id}`}
                className="text-xs text-muted-foreground cursor-pointer select-none"
              >
                Compare
              </label>
            </div>
          )}
          {roleLabel && (
            <Badge variant="secondary" className="text-xs">
              {roleLabel}
            </Badge>
          )}
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {node.last_heard ? formatDistanceToNow(node.last_heard, { addSuffix: true }) : 'Never'}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-slate-600 dark:text-slate-400">ID: {node.node_id_str}</p>
        {node.owner && <p className="text-slate-600 dark:text-slate-400">Owner: {node.owner.username}</p>}
        {node.latest_device_metrics && (
          <div className="flex flex-wrap gap-3 text-sm">
            <span>
              Battery:{' '}
              {node.latest_device_metrics.battery_level != null ? `${node.latest_device_metrics.battery_level}%` : '—'}
            </span>
            <span>
              Ch. util:{' '}
              {node.latest_device_metrics.channel_utilization != null
                ? `${node.latest_device_metrics.channel_utilization.toFixed(1)}%`
                : '—'}
            </span>
            <span>
              Uptime:{' '}
              {node.latest_device_metrics.uptime_seconds != null
                ? `${Math.round(node.latest_device_metrics.uptime_seconds / 3600)}h`
                : '—'}
            </span>
          </div>
        )}
        {metrics != null && metrics.length > 0 && dateRange && (
          <div className="mt-3 -mx-2">
            <NodeMiniChart metrics={metrics} dateRange={dateRange} />
          </div>
        )}
      </div>
      <div className="mt-auto flex justify-end pt-3">
        <Link
          to={`/nodes/${node.node_id}`}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Open node details
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
