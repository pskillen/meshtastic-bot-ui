import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ObservedNode } from '@/lib/models';

interface NodeCardProps {
  node: ObservedNode;
}

export function NodeCard({ node }: NodeCardProps) {
  return (
    <Link
      key={node.node_id}
      to={`/nodes/${node.node_id}`}
      className="block p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-slate-200 dark:border-slate-700"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{node.short_name}</h2>
          <p className="text-slate-600 dark:text-slate-400">{node.long_name}</p>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Last heard: {node.last_heard ? formatDistanceToNow(node.last_heard, { addSuffix: true }) : 'Never'}
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-slate-600 dark:text-slate-400">ID: {node.node_id_str}</p>
        <p className="text-slate-600 dark:text-slate-400">Model: {node.hw_model}</p>
        <p className="text-slate-600 dark:text-slate-400">Version: {node.sw_version}</p>
        {node.latest_device_metrics && (
          <p className="text-slate-600 dark:text-slate-400">
            Battery:{' '}
            {node.latest_device_metrics.battery_level != null ? `${node.latest_device_metrics.battery_level}%` : '—'}
          </p>
        )}
      </div>
    </Link>
  );
}
