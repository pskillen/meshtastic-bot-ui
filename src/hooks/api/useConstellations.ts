import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';
import { Constellation, MessageChannel } from '@/lib/models';

/**
 * Hook to fetch all constellations
 * @param enabled Whether the query is enabled
 * @returns Query result with constellations data and loading/error states
 */
export function useConstellations(enabled = true) {
  const api = useMeshtasticApi();

  return useQuery<Constellation[], Error>({
    queryKey: ['constellations'],
    queryFn: () => api.getConstellations(),
    enabled,
  });
}

/**
 * Hook to fetch channels for a specific constellation
 * @param constellationId ID of the constellation
 * @param enabled Whether the query is enabled
 * @returns Query result with channels data and loading/error states
 */
export function useConstellationChannels(constellationId: number, enabled = true) {
  const api = useMeshtasticApi();

  return useQuery<MessageChannel[], Error>({
    queryKey: ['constellations', constellationId, 'channels'],
    queryFn: () => api.getConstellationChannels(constellationId),
    enabled: !!constellationId && enabled,
  });
}

/**
 * Hook to create a new constellation
 * @returns Mutation for creating a constellation
 */
export function useCreateConstellation() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description: string }) => {
      // This is a placeholder - the actual API method needs to be implemented in meshtastic-api.ts
      throw new Error('Not implemented: createConstellation');
      // return api.createConstellation(data.name, data.description);
    },
    onSuccess: () => {
      // Invalidate the constellations query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['constellations'] });
    },
  });
}

/**
 * Hook to create a new channel in a constellation
 * @returns Mutation for creating a channel
 */
export function useCreateChannel() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { constellationId: number; name: string }) => {
      // This is a placeholder - the actual API method needs to be implemented in meshtastic-api.ts
      throw new Error('Not implemented: createChannel');
      // return api.createConstellationChannel(data.constellationId, data.name);
    },
    onSuccess: (_, variables) => {
      // Invalidate the channels query for the specific constellation
      queryClient.invalidateQueries({
        queryKey: ['constellations', variables.constellationId, 'channels'],
      });
    },
  });
}
