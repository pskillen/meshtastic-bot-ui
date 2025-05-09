import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';
import { NodeClaim } from '@/lib/models';
import { authService } from '@/lib/auth/authService';

/**
 * Hook to fetch claim status for a node
 * @param nodeId ID of the node
 * @param enabled Whether the query is enabled
 * @returns Query result with claim status and loading/error states
 */
export function useNodeClaimStatus(nodeId: number, enabled = true) {
  const api = useMeshtasticApi();

  return useQuery<NodeClaim | undefined, Error>({
    queryKey: ['nodes', nodeId, 'claim'],
    queryFn: () => api.getClaimStatus(nodeId),
    enabled: !!nodeId && enabled,
  });
}

/**
 * Hook to claim a node
 * @returns Mutation for claiming a node
 */
export function useClaimNode() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: number) => api.claimNode(nodeId),
    onSuccess: (_, nodeId) => {
      // Invalidate the claim status query for the specific node
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeId, 'claim'] });

      // Also invalidate the user's claimed nodes list
      queryClient.invalidateQueries({ queryKey: ['observed-nodes', 'mine'] });
    },
  });
}

/**
 * Hook to create a managed node from a claimed node
 * @returns Mutation for creating a managed node
 */
export function useCreateManagedNode() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();

  const currentUser = authService.getCurrentUser();

  return useMutation({
    mutationFn: (data: {
      nodeId: number;
      constellationId: number;
      name: string;
      options?: {
        defaultLocationLatitude?: number;
        defaultLocationLongitude?: number;
        channels?: {
          channel_0?: number | null;
          channel_1?: number | null;
          channel_2?: number | null;
          channel_3?: number | null;
          channel_4?: number | null;
          channel_5?: number | null;
          channel_6?: number | null;
          channel_7?: number | null;
        };
      };
    }) => {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      return api.createManagedNode(data.nodeId, data.constellationId, data.name, currentUser.id, data.options);
    },
    onSuccess: () => {
      // Invalidate the managed nodes queries
      queryClient.invalidateQueries({ queryKey: ['managed-nodes'] });
      queryClient.invalidateQueries({ queryKey: ['managed-nodes', 'mine'] });
    },
  });
}

/**
 * Suspense-enabled hook to fetch claim status for a node
 * Use inside a <Suspense> boundary. No isLoading or error states are returned.
 * Note: Suspense hooks do not support the 'enabled' option.
 */
export function useNodeClaimStatusSuspense(nodeId: number) {
  const api = useMeshtasticApi();
  // Note: Suspense hooks do not support 'enabled'.
  const query = useSuspenseQuery<NodeClaim | undefined, Error>({
    queryKey: ['nodes', nodeId, 'claim'],
    queryFn: () => api.getClaimStatus(nodeId),
  });
  return {
    claimStatus: query.data,
  };
}

/**
 * Suspense-friendly mutation for claiming a node
 * Note: Mutations do not suspend, but this is designed for Suspense trees.
 */
export function useClaimNodeSuspense() {
  // This is the same as the classic mutation, but documented for Suspense usage
  return useClaimNode();
}

/**
 * Hook to fetch all claims for the current user
 * @returns Query result with all claims and loading/error states
 */
export function useUserClaims() {
  const api = useMeshtasticApi();

  return useQuery<NodeClaim[], Error>({
    queryKey: ['node-claims', 'mine'],
    queryFn: () => api.getMyClaims(),
  });
}

/**
 * Suspense-enabled hook to fetch all claims for the current user
 * Use inside a <Suspense> boundary. No isLoading or error states are returned.
 */
export function useUserClaimsSuspense() {
  const api = useMeshtasticApi();

  const query = useSuspenseQuery<NodeClaim[], Error>({
    queryKey: ['node-claims', 'mine'],
    queryFn: () => api.getMyClaims(),
  });

  return {
    claims: query.data,
  };
}
