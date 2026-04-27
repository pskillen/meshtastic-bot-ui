import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTraceroutesWebSocketInvalidator } from './useTraceroutesWithWebSocket';

vi.mock('@/providers/ConfigProvider', () => ({
  useConfig: () => ({
    apis: {
      meshBot: { baseUrl: 'http://127.0.0.1:8000' },
    },
  }),
}));

vi.mock('@/lib/auth/authService', () => ({
  authService: {
    getAccessToken: () => 'test-access-token',
  },
}));

type WsMock = {
  url: string;
  onmessage: ((ev: MessageEvent) => void) | null;
  close: ReturnType<typeof vi.fn>;
};

const wsInstances: WsMock[] = [];

beforeEach(() => {
  wsInstances.length = 0;
  vi.stubGlobal(
    'WebSocket',
    class {
      url: string;
      onmessage: ((ev: MessageEvent) => void) | null = null;
      close = vi.fn();
      constructor(url: string) {
        this.url = url;
        wsInstances.push(this);
      }
    } as unknown as typeof WebSocket
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper, invalidateSpy };
}

describe('useTraceroutesWebSocketInvalidator', () => {
  it('opens ws URL with token and invalidates traceroute queries on status message', async () => {
    const { Wrapper, invalidateSpy } = createWrapper();

    renderHook(() => useTraceroutesWebSocketInvalidator(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(wsInstances.length).toBe(1);
    });
    const sock = wsInstances[0];
    expect(sock.url).toContain('ws://127.0.0.1:8000/ws/traceroutes/');
    expect(sock.url).toContain('token=test-access-token');
    expect(sock.onmessage).toEqual(expect.any(Function));

    invalidateSpy.mockClear();
    sock.onmessage!(new MessageEvent('message', { data: JSON.stringify({ id: 99, status: 'sent' }) }));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['traceroutes'] });
  });

  it('does not invalidate on malformed JSON', async () => {
    const { Wrapper, invalidateSpy } = createWrapper();
    renderHook(() => useTraceroutesWebSocketInvalidator(), { wrapper: Wrapper });
    await waitFor(() => expect(wsInstances.length).toBe(1));
    const sock = wsInstances[0];
    invalidateSpy.mockClear();
    sock.onmessage!(new MessageEvent('message', { data: 'not-json' }));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
