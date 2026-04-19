import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { FeederRange, FeederRangesData } from '@/hooks/api/useFeederRanges';

import { FeederCoverageMapPage } from './FeederCoverageMapPage';

const useFeederRangesMock = vi.fn();

vi.mock('@/hooks/api/useFeederRanges', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/api/useFeederRanges')>(
    '@/hooks/api/useFeederRanges'
  );
  return {
    ...actual,
    useFeederRanges: (params?: unknown) => useFeederRangesMock(params),
  };
});

vi.mock('@/components/traceroutes/FeederCoverageMap', () => ({
  FeederCoverageMap: (props: {
    feeders: FeederRange[];
    metric: string;
    mode: string;
    showLowConfidence: boolean;
  }) => (
    <div
      data-testid="map-stub"
      data-feeders={props.feeders.length}
      data-metric={props.metric}
      data-mode={props.mode}
      data-show-low={String(props.showLowConfidence)}
    />
  ),
}));

function makeFeeder(args: { node_id: number } & Partial<Omit<FeederRange, 'node_id'>>): FeederRange {
  const { node_id, ...overrides } = args;
  return {
    managed_node_id: `mn-${node_id}`,
    node_id,
    node_id_str: `!${node_id.toString(16).padStart(8, '0')}`,
    short_name: `F${node_id}`,
    long_name: null,
    lat: 55.86,
    lng: -4.25,
    direct: {
      sample_count: 20,
      p50_km: 4,
      p90_km: 8,
      p95_km: 10,
      max_km: 14,
      low_confidence: false,
    },
    any: {
      sample_count: 50,
      p50_km: 6,
      p90_km: 18,
      p95_km: 25,
      max_km: 40,
      low_confidence: false,
    },
    ...overrides,
  };
}

function setData(feeders: FeederRange[]) {
  const data: FeederRangesData = {
    feeders,
    meta: { min_samples: 10, window: { start: null, end: null } },
  };
  useFeederRangesMock.mockReturnValue({ data, isLoading: false, error: null });
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <FeederCoverageMapPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('FeederCoverageMapPage', () => {
  beforeEach(() => {
    useFeederRangesMock.mockReset();
  });
  afterEach(() => {
    useFeederRangesMock.mockReset();
  });

  it('renders defaults: p95, direct-only, low-confidence hidden', () => {
    setData([makeFeeder({ node_id: 1 })]);
    renderPage();
    const map = screen.getByTestId('map-stub');
    expect(map.getAttribute('data-metric')).toBe('p95');
    expect(map.getAttribute('data-mode')).toBe('direct');
    expect(map.getAttribute('data-show-low')).toBe('false');
  });

  it('changes metric when a metric toggle is clicked (label = "50% of successes")', () => {
    setData([makeFeeder({ node_id: 1 })]);
    renderPage();
    const p50Btn = screen.getByRole('radio', { name: /50% of successes/i });
    act(() => {
      fireEvent.click(p50Btn);
    });
    const map = screen.getByTestId('map-stub');
    expect(map.getAttribute('data-metric')).toBe('p50');
  });

  it('uses a "Range covers" label and explains percentile semantics in the stats card', () => {
    setData([makeFeeder({ node_id: 1 })]);
    renderPage();
    expect(screen.getByText(/Range covers/i)).toBeInTheDocument();
    // Stats card explains the chosen percentile in plain English (default metric=p95).
    expect(
      screen.getAllByText(/Circle = radius containing 95% of successful direct-only TR targets/i)[0]
    ).toBeInTheDocument();
  });

  it('switches mode to Any path', () => {
    setData([makeFeeder({ node_id: 1 })]);
    renderPage();
    const anyBtn = screen.getByRole('radio', { name: /Any path/i });
    act(() => {
      fireEvent.click(anyBtn);
    });
    expect(screen.getByTestId('map-stub').getAttribute('data-mode')).toBe('any');
  });

  it('counts low-confidence feeders for the current mode', () => {
    setData([
      makeFeeder({ node_id: 1 }),
      makeFeeder({
        node_id: 2,
        direct: {
          sample_count: 2,
          p50_km: 1,
          p90_km: 2,
          p95_km: 2.5,
          max_km: 3,
          low_confidence: true,
        },
      }),
    ]);
    renderPage();
    // Direct mode, low-confidence hidden -> visible: 1, low-conf count: 1
    expect(screen.getAllByText(/Feeders shown:/i)[0]).toHaveTextContent('Feeders shown: 1');
    expect(screen.getAllByText(/Low confidence:/i)[0]).toHaveTextContent('Low confidence: 1');
  });

  it('forwards minSamples to the hook', () => {
    setData([]);
    renderPage();
    const input = screen.getByLabelText(/Min samples/i) as HTMLInputElement;
    act(() => {
      fireEvent.change(input, { target: { value: '25' } });
    });
    const lastCallParams = useFeederRangesMock.mock.calls.at(-1)?.[0] as { minSamples?: number };
    expect(lastCallParams?.minSamples).toBe(25);
  });

  it('feeder filter dropdown defaults to "All feeders" and the map sees every feeder', () => {
    setData([makeFeeder({ node_id: 1 }), makeFeeder({ node_id: 2 }), makeFeeder({ node_id: 3 })]);
    renderPage();
    expect(screen.getByRole('button', { name: /All feeders \(3\)/i })).toBeInTheDocument();
    expect(screen.getByTestId('map-stub').getAttribute('data-feeders')).toBe('3');
  });

  it('unchecking a feeder narrows the map data and shows a reset button', async () => {
    const user = userEvent.setup();
    setData([
      makeFeeder({ node_id: 1, short_name: 'AAA' }),
      makeFeeder({ node_id: 2, short_name: 'BBB' }),
      makeFeeder({ node_id: 3, short_name: 'CCC' }),
    ]);
    renderPage();

    await user.click(screen.getByRole('button', { name: /All feeders \(3\)/i }));
    // Radix renders menu items via a portal; query the document.
    const aaaItem = await waitFor(() =>
      screen.getByRole('menuitemcheckbox', { name: /AAA/i })
    );
    await user.click(aaaItem);

    await waitFor(() => {
      expect(screen.getByTestId('map-stub').getAttribute('data-feeders')).toBe('2');
    });
    expect(await screen.findByText(/2 of 3 feeders/i)).toBeInTheDocument();

    // Close the dropdown so the reset button outside it isn't aria-hidden by Radix.
    await user.keyboard('{Escape}');

    // Reset button restores the default "all" state.
    await user.click(await screen.findByRole('button', { name: /Clear feeder filter/i }));
    await waitFor(() => {
      expect(screen.getByTestId('map-stub').getAttribute('data-feeders')).toBe('3');
    });
    expect(await screen.findByText(/All feeders \(3\)/i)).toBeInTheDocument();
  });
});
