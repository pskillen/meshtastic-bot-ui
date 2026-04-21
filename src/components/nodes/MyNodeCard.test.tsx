import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ObservedNode } from '@/lib/models';

import { MyNodeCard } from './MyNodeCard';

vi.mock('@/components/nodes/MeshWatchControls', () => ({
  MeshWatchControls: () => <div data-testid="mesh-watch">watch</div>,
}));

function makeNode(overrides: Partial<ObservedNode> = {}): ObservedNode {
  return {
    internal_id: 1,
    node_id: 100,
    node_id_str: '!00000064',
    mac_addr: null,
    long_name: 'Long',
    short_name: 'SN',
    hw_model: null,
    public_key: null,
    role: 2,
    last_heard: new Date('2026-04-21T10:00:00Z'),
    latest_position: null,
    owner: { id: 1, username: 'me' },
    ...overrides,
  } as ObservedNode;
}

function renderCard(props: Partial<ComponentProps<typeof MyNodeCard>> = {}) {
  const client = new QueryClient();
  const node = props.node ?? makeNode();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MyNodeCard
          node={node}
          isManaged={props.isManaged ?? false}
          isClaimed={props.isClaimed ?? true}
          showClaimedBadge={props.showClaimedBadge}
          managedLiveness={props.managedLiveness}
          watch={props.watch}
          watchesQuery={props.watchesQuery ?? { isLoading: false, isError: false }}
          onConvert={props.onConvert ?? vi.fn()}
          onShowSetupInstructions={props.onShowSetupInstructions ?? vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MyNodeCard', () => {
  it('hides Claimed badge when showClaimedBadge is false', () => {
    renderCard({ showClaimedBadge: false, isClaimed: true });
    expect(screen.queryByText('Claimed')).not.toBeInTheDocument();
  });

  it('shows Claimed badge by default when claimed', () => {
    renderCard({ isClaimed: true });
    expect(screen.getByText('Claimed')).toBeInTheDocument();
  });

  it('shows No GPS position when coords missing', () => {
    renderCard({ node: makeNode({ latest_position: null }) });
    expect(screen.getByText('No GPS position')).toBeInTheDocument();
  });

  it('shows GPS position recent for fresh reported_time', () => {
    renderCard({
      node: makeNode({
        latest_position: {
          latitude: 55,
          longitude: -4,
          reported_time: new Date('2026-04-21T11:00:00Z'),
          logged_time: null,
          altitude: null,
          location_source: 'gps',
        },
      }),
    });
    expect(screen.getByText('GPS position recent')).toBeInTheDocument();
  });

  it('renders managed liveness warning when severity is warn', () => {
    renderCard({
      isManaged: true,
      managedLiveness: {
        severity: 'warn',
        message: 'Radio has not been heard — test message.',
      },
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Attention')).toBeInTheDocument();
    expect(screen.getByText(/Radio has not been heard/)).toBeInTheDocument();
  });

  it('does not render liveness alert when severity is ok', () => {
    renderCard({
      isManaged: true,
      managedLiveness: { severity: 'ok', message: null },
    });
    expect(screen.queryByText('Attention')).not.toBeInTheDocument();
    expect(screen.queryByText('Connectivity issue')).not.toBeInTheDocument();
  });
});
