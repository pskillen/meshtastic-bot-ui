import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMeshtasticApi } from '@/hooks/api/useApi';

export const discordNotificationPrefsQueryKey = ['auth', 'discord-notifications'] as const;

export function useDiscordNotificationPrefs() {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: discordNotificationPrefsQueryKey,
    queryFn: () => api.getDiscordNotificationPrefs(),
  });
}

export function usePatchDiscordNotificationPrefs() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patchDiscordNotificationPrefs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discordNotificationPrefsQueryKey });
    },
  });
}

export function usePostDiscordNotificationTest() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.postDiscordNotificationTest(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discordNotificationPrefsQueryKey });
    },
  });
}
