import { useState, useEffect } from 'react';

const STORAGE_KEY = 'monitored-nodes';

/**
 * Hook to manage a list of monitored node IDs in localStorage
 * @returns Object with monitoredNodeIds array and methods to add/remove nodes
 */
export function useMonitoredNodes() {
  const [monitoredNodeIds, setMonitoredNodeIds] = useState<number[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(monitoredNodeIds));
  }, [monitoredNodeIds]);

  const addNode = (nodeId: number) => {
    if (!monitoredNodeIds.includes(nodeId)) {
      setMonitoredNodeIds([...monitoredNodeIds, nodeId]);
    }
  };

  const removeNode = (nodeId: number) => {
    setMonitoredNodeIds(monitoredNodeIds.filter((id) => id !== nodeId));
  };

  return {
    monitoredNodeIds,
    addNode,
    removeNode,
  };
}
