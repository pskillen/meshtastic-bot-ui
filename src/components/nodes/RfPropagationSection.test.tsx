import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import type { ObservedNode } from '@/lib/models';
import { RfPropagationSection } from './RfPropagationSection';

const useRfProfile = vi.fn();
const useRfPropagation = vi.fn();
const useRecomputeRfPropagation = vi.fn();

vi.mock('@/hooks/api/useRfPropagation', () => ({
  useRfProfile: (...args: unknown[]) => useRfProfile(...args),
  useRfPropagation: (...args: unknown[]) => useRfPropagation(...args),
  useUpdateRfProfile: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useRecomputeRfPropagation: (...args: unknown[]) => useRecomputeRfPropagation(...args),
}));

function makeNode(overrides: Partial<ObservedNode> = {}): ObservedNode {
  return {
    internal_id: 1,
    node_id: 200,
    node_id_str: '!000000c8',
    mac_addr: null,
    long_name: 'Tower',
    short_name: 'TWR',
    hw_model: null,
    public_key: null,
    role: 2,
    last_heard: null,
    ...overrides,
  } as ObservedNode;
}

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('RfPropagationSection', () => {
  beforeEach(() => {
    useRecomputeRfPropagation.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it('hides content for non-owner stranger without a profile', () => {
    useRfProfile.mockReturnValue({ data: undefined, isLoading: false });
    useRfPropagation.mockReturnValue({ data: { status: 'none' }, isLoading: false });
    const { container } = renderWithClient(
      <RfPropagationSection node={makeNode({ rf_profile_editable: false, has_rf_profile: false })} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows public summary for stranger when has_rf_profile', () => {
    useRfProfile.mockReturnValue({
      data: { antenna_pattern: 'omni', tx_power_dbm: 20 },
      isLoading: false,
    });
    useRfPropagation.mockReturnValue({ data: { status: 'none' }, isLoading: false });
    renderWithClient(
      <RfPropagationSection node={makeNode({ rf_profile_editable: false, has_rf_profile: true })} />
    );
    expect(screen.getByText(/RF propagation/i)).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.queryByTitle('Edit RF profile')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /render now/i })).not.toBeInTheDocument();
  });

  it('shows settings and render controls for owner', () => {
    useRfProfile.mockReturnValue({ data: null, isLoading: false });
    useRfPropagation.mockReturnValue({ data: { status: 'pending' }, isLoading: false });
    renderWithClient(
      <RfPropagationSection node={makeNode({ rf_profile_editable: true, has_rf_profile: false })} />
    );
    expect(screen.getByTitle('Edit RF profile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /render now/i })).toBeInTheDocument();
  });

  it('renders Leaflet container when render is ready and node flags allow map', () => {
    useRfProfile.mockReturnValue({
      data: { antenna_pattern: 'omni' },
      isLoading: false,
    });
    useRfPropagation.mockReturnValue({
      data: {
        status: 'ready',
        asset_url: 'https://example.com/x.png',
        bounds: { west: -5, south: 54, east: -3, north: 56 },
        created_at: '2026-01-01T00:00:00Z',
      },
      isLoading: false,
    });
    renderWithClient(
      <RfPropagationSection
        node={makeNode({ rf_profile_editable: true, has_rf_profile: true, has_ready_rf_render: true })}
      />
    );
    expect(document.querySelector('.leaflet-container')).not.toBeNull();
  });
});
