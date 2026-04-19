import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ObservedNode } from '@/lib/models';

import { InfrastructureNodeCard } from './InfrastructureNodeCard';

function makeNode(overrides: Partial<ObservedNode> = {}): ObservedNode {
  return {
    internal_id: 1,
    node_id: 100,
    node_id_str: '!00000064',
    mac_addr: null,
    long_name: 'Hilltop',
    short_name: 'HILL',
    hw_model: null,
    public_key: null,
    role: 2,
    last_heard: new Date('2026-04-19T10:00:00Z'),
    latest_position: null,
    ...overrides,
  } as ObservedNode;
}

describe('InfrastructureNodeCard', () => {
  it('renders a deep-linked Coverage map link to /traceroutes/map/coverage?feeder=<node_id>', () => {
    render(
      <MemoryRouter>
        <InfrastructureNodeCard node={makeNode({ node_id: 4242 })} />
      </MemoryRouter>
    );
    const link = screen.getByTestId('infra-coverage-link-4242');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/traceroutes/map/coverage?feeder=4242');
  });

  it('also renders the Open node details link to /nodes/<node_id>', () => {
    render(
      <MemoryRouter>
        <InfrastructureNodeCard node={makeNode({ node_id: 7 })} />
      </MemoryRouter>
    );
    const detailsLink = screen.getByRole('link', { name: /open node details/i });
    expect(detailsLink.getAttribute('href')).toBe('/nodes/7');
  });
});
