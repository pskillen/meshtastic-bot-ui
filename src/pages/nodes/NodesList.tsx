import { Link } from 'react-router-dom';
import { useNodes } from '@/lib/hooks/useNodes';
import { formatDistanceToNow } from 'date-fns';

export function NodesList() {
  const { nodes, isLoading, error } = useNodes();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error instanceof Error ? error.message : 'Failed to fetch nodes'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Meshtastic Nodes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes?.map((node) => (
          <Link
            key={node.id}
            to={`/nodes/${node.id}`}
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{node.short_name}</h2>
                <p className="text-gray-600">{node.long_name}</p>
              </div>
              <span className="text-sm text-gray-500">
                Last heard: {node.last_heard ? formatDistanceToNow(new Date(node.last_heard), { addSuffix: true }) : 'Never'}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600">ID: {node.node_id}</p>
              <p className="text-gray-600">Model: {node.hardware_model}</p>
              <p className="text-gray-600">Version: {node.meshtastic_version}</p>
              {node.latest_device_metrics && (
                <p className="text-gray-600">Battery: {node.latest_device_metrics.battery_level}%</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 