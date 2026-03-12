import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConfig } from '@/providers/ConfigProvider';
import { authService } from '@/lib/auth/authService';
import { useTraceroutes, UseTraceroutesParams } from '@/hooks/api/useTraceroutes';

/**
 * Hook to fetch traceroutes and subscribe to real-time status updates via WebSocket.
 * Connects to ws/traceroutes/ when mounted; invalidates traceroutes query on status updates.
 */
export function useTraceroutesWithWebSocket(params?: UseTraceroutesParams) {
  const queryClient = useQueryClient();
  const config = useConfig();
  const socketRef = useRef<WebSocket | null>(null);

  const result = useTraceroutes(params);

  useEffect(() => {
    const token = authService.getAccessToken();
    if (!token || !config.apis.meshBot.baseUrl) return;

    const baseUrl = config.apis.meshBot.baseUrl.replace(/^http/, 'ws');
    const wsUrl = `${baseUrl}/ws/traceroutes/?token=${token}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { id: number; status: string };
        if (data.id != null && data.status) {
          queryClient.invalidateQueries({ queryKey: ['traceroutes'] });
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [config.apis.meshBot.baseUrl, queryClient]);

  return result;
}
