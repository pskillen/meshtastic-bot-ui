import { ObservedNode } from '../models';

// Helper method to convert ObservedNode to NodeData for backward compatibility
export function parseObservedNodeFromAPI(node: ObservedNode): ObservedNode {
  return {
    ...node,
    last_heard: node.last_heard ? new Date(node.last_heard) : null,
    latest_position: node.latest_position
      ? {
          ...node.latest_position,
          logged_time: new Date(node.latest_position.logged_time),
          reported_time: new Date(node.latest_position.reported_time),
        }
      : null,
    latest_device_metrics: node.latest_device_metrics
      ? {
          ...node.latest_device_metrics,
          logged_time: new Date(node.latest_device_metrics.logged_time),
          reported_time: new Date(node.latest_device_metrics.reported_time),
        }
      : null,
  };
}
