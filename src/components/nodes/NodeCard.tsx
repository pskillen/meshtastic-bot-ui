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
      className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{node.short_name}</h2>
          <p className="text-gray-600">{node.long_name}</p>
        </div>
        <span className="text-sm text-gray-500">
          Last heard: {node.last_heard ? formatDistanceToNow(node.last_heard, { addSuffix: true }) : 'Never'}
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-gray-600">ID: {node.node_id}</p>
        <p className="text-gray-600">Model: {node.hw_model}</p>
        <p className="text-gray-600">Version: {node.sw_version}</p>
        {node.latest_device_metrics && (
          <p className="text-gray-600">Battery: {node.latest_device_metrics.battery_level}%</p>
        )}
      </div>
    </Link>
  );
}
