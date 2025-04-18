import { useState, useEffect } from 'react';
import { NodeData } from '../models';

// Type for storing recent nodes in local storage
interface RecentNode {
  id: number;
  node_id: string;
  short_name: string;
  long_name: string;
  viewed_at: string; // ISO string of when the node was viewed
}

const STORAGE_KEY = 'meshtastic-recent-nodes';
const MAX_RECENT_NODES = 5; // Maximum number of recent nodes to store

export function useRecentNodes() {
  const [recentNodes, setRecentNodes] = useState<RecentNode[]>([]);

  // Load recent nodes from local storage on component mount
  useEffect(() => {
    const storedNodes = localStorage.getItem(STORAGE_KEY);
    if (storedNodes) {
      try {
        setRecentNodes(JSON.parse(storedNodes));
      } catch (error) {
        console.error('Failed to parse recent nodes from local storage:', error);
        // If parsing fails, reset the storage
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save to localStorage whenever recentNodes changes
  useEffect(() => {
    if (recentNodes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentNodes));
    }
  }, [recentNodes]);

  // Add a node to the recent nodes list
  const addRecentNode = (node: NodeData) => {
    setRecentNodes((prevNodes) => {
      // Check if the node already exists with the same ID
      if (prevNodes.some((n) => n.id === node.id)) {
        return prevNodes; // No change needed
      }

      // Create a new node entry
      const newNode: RecentNode = {
        id: node.id,
        node_id: node.node_id,
        short_name: node.short_name,
        long_name: node.long_name,
        viewed_at: new Date().toISOString(),
      };

      // Remove the node if it already exists in the list
      const filteredNodes = prevNodes.filter((n) => n.id !== node.id);

      // Add the new node at the beginning of the list
      return [newNode, ...filteredNodes].slice(0, MAX_RECENT_NODES);
    });
  };

  return {
    recentNodes,
    addRecentNode,
  };
}
