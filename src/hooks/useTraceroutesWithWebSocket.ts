import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConfig } from '@/providers/ConfigProvider';
import { authService } from '@/lib/auth/authService';
import {
  useTraceroutes,
  useTraceroutesInfinite,
  UseTraceroutesParams,
  UseTraceroutesInfiniteParams,
} from '@/hooks/api/useTraceroutes';

/**
 * Subscribe to live traceroute status updates via WebSocket and invalidate the
 * shared `['traceroutes']` query cache when one arrives. Used by both the
 * page-level history and embedded sections (including mesh watches table).
 */
export function useTraceroutesWebSocketInvalidator() {
  const queryClient = useQueryClient();
  const config = useConfig();
  const socketRef = useRef<WebSocket | null>(null);

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
}

/**
 * Hook to fetch traceroutes (single page) and subscribe to real-time status updates.
 */
export function useTraceroutesWithWebSocket(params?: UseTraceroutesParams) {
  useTraceroutesWebSocketInvalidator();
  return useTraceroutes(params);
}

/**
 * Hook to fetch traceroutes paginated via useInfiniteQuery, with real-time updates.
 * The full row list is exposed as `traceroutes` (flattened across pages).
 */
export function useTraceroutesInfiniteWithWebSocket(params?: UseTraceroutesInfiniteParams) {
  useTraceroutesWebSocketInvalidator();
  const query = useTraceroutesInfinite(params);
  const traceroutes = query.data?.pages.flatMap((p) => p.results) ?? [];
  const totalCount = query.data?.pages[0]?.count ?? null;
  return { ...query, traceroutes, totalCount };
}
