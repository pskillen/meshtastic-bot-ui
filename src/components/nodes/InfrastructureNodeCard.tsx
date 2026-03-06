import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ObservedNode } from '@/lib/models';
import { Badge } from '@/components/ui/badge';

const ROLE_LABELS: Record<number, string> = {
  2: 'ROUTER',
  3: 'ROUTER_CLIENT',
  4: 'REPEATER',
  11: 'ROUTER_LATE',
  12: 'CLIENT_BASE',
};

interface InfrastructureNodeCardProps {
  node: ObservedNode;
}

export function InfrastructureNodeCard({ node }: InfrastructureNodeCardProps) {
  const roleLabel = node.role != null ? (ROLE_LABELS[node.role] ?? `Role ${node.role}`) : null;

  return (
    <Link
      to={`/nodes/${node.node_id}`}
      className="block p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{node.short_name}</h2>
          <p className="text-gray-600 dark:text-gray-400">{node.long_name}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {roleLabel && (
            <Badge variant="secondary" className="text-xs">
              {roleLabel}
            </Badge>
          )}
          <span className="text-sm text-gray-500">
            {node.last_heard ? formatDistanceToNow(node.last_heard, { addSuffix: true }) : 'Never'}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-gray-600 dark:text-gray-400">ID: {node.node_id_str}</p>
        {node.owner && <p className="text-gray-600 dark:text-gray-400">Owner: {node.owner.username}</p>}
        {node.latest_device_metrics && (
          <div className="flex flex-wrap gap-3 text-sm">
            <span>Battery: {node.latest_device_metrics.battery_level}%</span>
            <span>Ch. util: {node.latest_device_metrics.channel_utilization?.toFixed(1)}%</span>
            <span>Uptime: {Math.round(node.latest_device_metrics.uptime_seconds / 3600)}h</span>
          </div>
        )}
      </div>
    </Link>
  );
}
