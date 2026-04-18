import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { AutoTraceRoute, ManagedNode, ObservedNode } from '@/lib/models';

vi.mock('@/hooks/useTraceroutesWithWebSocket', () => ({
  useTraceroutesInfiniteWithWebSocket: vi.fn(),
}));
vi.mock('@/hooks/api/useTraceroutes', () => ({
  useTracerouteTriggerableNodesSuspense: vi.fn(),
  useTriggerTraceroute: vi.fn(),
}));
vi.mock('@/hooks/api/useNodes', () => ({
  useNodesSuspense: vi.fn(),
}));

vi.mock('@/components/traceroutes/TracerouteStatsSection', () => ({
  TracerouteStatsSection: () => <div data-testid="stats-section" />,
}));

vi.mock('@/pages/traceroutes/TracerouteDetailModal', () => ({
  TracerouteDetailModal: ({ tracerouteId, open }: { tracerouteId: number | null; open: boolean }) =>
    open ? <div role="dialog" data-testid="detail-modal">Detail for {tracerouteId}</div> : null,
}));

vi.mock('@/pages/traceroutes/TriggerTracerouteModal', () => ({
  TriggerTracerouteModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" data-testid="trigger-modal">Trigger modal</div> : null,
}));

import { useTraceroutesInfiniteWithWebSocket } from '@/hooks/useTraceroutesWithWebSocket';
import { useTracerouteTriggerableNodesSuspense, useTriggerTraceroute } from '@/hooks/api/useTraceroutes';
import { useNodesSuspense } from '@/hooks/api/useNodes';
import { TracerouteHistory } from './TracerouteHistory';

const mockedUseInfinite = vi.mocked(useTraceroutesInfiniteWithWebSocket);
const mockedUseTriggerable = vi.mocked(useTracerouteTriggerableNodesSuspense);
const mockedUseTrigger = vi.mocked(useTriggerTraceroute);
const mockedUseNodes = vi.mocked(useNodesSuspense);

function makeManagedNode(overrides: Partial<ManagedNode> = {}): ManagedNode {
  return {
    node_id: 200,
    long_name: 'Source node',
    short_name: 'SRC',
    last_heard: null,
    node_id_str: '!000000c8',
    owner: { id: 1, username: 'me' },
    constellation: { id: 1, name: 'C1' },
    allow_auto_traceroute: true,
    position: { latitude: null, longitude: null },
    ...overrides,
  };
}

function makeTraceroute(overrides: Partial<AutoTraceRoute> = {}): AutoTraceRoute {
  return {
    id: 1,
    source_node: makeManagedNode(),
    target_node: {
      internal_id: 1,
      node_id: 100,
      node_id_str: '!00000064',
      mac_addr: null,
      long_name: 'Target',
      short_name: 'TGT',
      hw_model: null,
      public_key: null,
    } as ObservedNode,
    trigger_type: 'user',
    triggered_by: 1,
    triggered_by_username: 'me',
    trigger_source: 'ui',
    triggered_at: '2026-04-17T10:00:00Z',
    status: 'completed',
    route: [],
    route_back: [],
    raw_packet: null,
    completed_at: '2026-04-17T10:00:05Z',
    error_message: null,
    ...overrides,
  };
}

interface InfiniteOptions {
  traceroutes?: AutoTraceRoute[];
  totalCount?: number | null;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: ReturnType<typeof vi.fn>;
}

function setupHooks(infinite: InfiniteOptions = {}, triggerable: ManagedNode[] = []) {
  const fetchNextPage = infinite.fetchNextPage ?? vi.fn();
  mockedUseInfinite.mockReturnValue({
    traceroutes: infinite.traceroutes ?? [],
    totalCount: infinite.totalCount ?? null,
    isLoading: infinite.isLoading ?? false,
    error: null,
    fetchNextPage,
    hasNextPage: infinite.hasNextPage ?? false,
    isFetchingNextPage: infinite.isFetchingNextPage ?? false,
  } as unknown as ReturnType<typeof useTraceroutesInfiniteWithWebSocket>);
  mockedUseTriggerable.mockReturnValue({ triggerableNodes: triggerable });
  mockedUseTrigger.mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useTriggerTraceroute>);
  mockedUseNodes.mockReturnValue({
    nodes: [],
    totalCount: 0,
  } as unknown as ReturnType<typeof useNodesSuspense>);
  return { fetchNextPage };
}

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TracerouteHistory />
    </MemoryRouter>
  );
}

describe('TracerouteHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates target_node from the URL into the query params', () => {
    setupHooks();
    renderAt('/traceroutes?target_node=1127903080');
    expect(mockedUseInfinite).toHaveBeenCalledWith(
      expect.objectContaining({ target_node: 1127903080 })
    );
  });

  it('hydrates target_node and status (CSV) from the URL', () => {
    setupHooks();
    renderAt('/traceroutes?target_node=42&status=completed,failed');
    expect(mockedUseInfinite).toHaveBeenCalledWith(
      expect.objectContaining({ target_node: 42, status: 'completed,failed' })
    );
  });

  it('hydrates trigger_type CSV from the URL', () => {
    setupHooks();
    renderAt('/traceroutes?trigger_type=user,monitor');
    expect(mockedUseInfinite).toHaveBeenCalledWith(
      expect.objectContaining({ trigger_type: 'user,monitor' })
    );
  });

  it('passes unknown filter values through to the API (graceful)', () => {
    setupHooks();
    renderAt('/traceroutes?status=bogus_value&target_node=999999999');
    expect(mockedUseInfinite).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'bogus_value', target_node: 999999999 })
    );
  });

  it('shows the Trigger CTA when the user has triggerable nodes', () => {
    setupHooks({}, [makeManagedNode()]);
    renderAt('/traceroutes');
    expect(screen.getByRole('button', { name: /trigger traceroute/i })).toBeInTheDocument();
  });

  it('hides the Trigger CTA when the user has no triggerable nodes', () => {
    setupHooks({}, []);
    renderAt('/traceroutes');
    expect(screen.queryByRole('button', { name: /^trigger traceroute$/i })).not.toBeInTheDocument();
  });

  it('shows a "Clear filters" button only when at least one filter is set', () => {
    setupHooks();
    const { unmount } = renderAt('/traceroutes');
    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
    unmount();

    renderAt('/traceroutes?target_node=42');
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('renders Load more disabled when there is no next page', () => {
    setupHooks({ traceroutes: [makeTraceroute()], hasNextPage: false });
    renderAt('/traceroutes');
    const btn = screen.getByRole('button', { name: /no more results/i });
    expect(btn).toBeDisabled();
  });

  it('calls fetchNextPage when Load more is clicked', () => {
    const fetchNextPage = vi.fn();
    setupHooks({
      traceroutes: [makeTraceroute()],
      hasNextPage: true,
      fetchNextPage,
    });
    renderAt('/traceroutes');
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));
    expect(fetchNextPage).toHaveBeenCalled();
  });

  it('shows the total count in the table title when available', () => {
    setupHooks({ traceroutes: [makeTraceroute()], totalCount: 73 });
    renderAt('/traceroutes');
    expect(screen.getByText('(73)')).toBeInTheDocument();
  });
});
