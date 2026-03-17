import { ObservedNode } from '../models';

// Helper method to convert ObservedNode to NodeData for backward compatibility
export function parseObservedNodeFromAPI(node: ObservedNode): ObservedNode {
  return {
    ...node,
    last_heard: node.last_heard ? new Date(node.last_heard) : null,
    latest_position: node.latest_position
      ? {
          ...node.latest_position,
          logged_time: node.latest_position.logged_time ? new Date(node.latest_position.logged_time) : null,
          reported_time: node.latest_position.reported_time ? new Date(node.latest_position.reported_time) : null,
        }
      : null,
    latest_device_metrics: node.latest_device_metrics
      ? {
          ...node.latest_device_metrics,
          logged_time: node.latest_device_metrics.logged_time ? new Date(node.latest_device_metrics.logged_time) : null,
          reported_time: node.latest_device_metrics.reported_time
            ? new Date(node.latest_device_metrics.reported_time)
            : null,
        }
      : null,
    latest_environment_metrics: node.latest_environment_metrics
      ? {
          ...node.latest_environment_metrics,
          reported_time: node.latest_environment_metrics.reported_time
            ? new Date(node.latest_environment_metrics.reported_time)
            : null,
        }
      : null,
    latest_power_metrics: node.latest_power_metrics
      ? {
          ...node.latest_power_metrics,
          reported_time: node.latest_power_metrics.reported_time
            ? new Date(node.latest_power_metrics.reported_time)
            : null,
        }
      : null,
  };
}
