import { useEffect, useState } from 'react';
import { useApi } from '@/lib/hooks/useApi';
import { NodeData } from '@/lib/models';
import { formatDistanceToNow } from 'date-fns';

export function NodesList() {
  const api = useApi();
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const data = await api.getNodes();
        setNodes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch nodes');
      } finally {
        setLoading(false);
      }
    };

    fetchNodes();
  }, [api]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading nodes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mesh Network Nodes</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{node.short_name}</h2>
                <p className="text-gray-600 dark:text-gray-300">{node.long_name}</p>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {node.last_heard
                  ? `Last heard ${formatDistanceToNow(new Date(node.last_heard), { addSuffix: true })}`
                  : 'Never heard'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Node ID:</span>
                <span className="font-mono">{node.node_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Hardware Model:</span>
                <span>{node.hardware_model}</span>
              </div>
              {node.latest_device_metrics && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Battery Level:</span>
                    <span>{node.latest_device_metrics.battery_level}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Voltage:</span>
                    <span>{node.latest_device_metrics.voltage}V</span>
                  </div>
                </>
              )}
              {node.last_position && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Location:</span>
                  <span>
                    {node.last_position.latitude.toFixed(6)}, {node.last_position.longitude.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 