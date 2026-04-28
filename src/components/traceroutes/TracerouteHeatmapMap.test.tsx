import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { HeatmapEdge, HeatmapNode } from '@/hooks/api/useHeatmapEdges';
import { TracerouteHeatmapMap } from './TracerouteHeatmapMap';

/** Real <Popup> needs MapContext; test only needs layer stability, not mapbox popups. */
vi.mock('react-map-gl', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-map-gl')>();
  return {
    ...mod,
    Popup: ({ children }: { children?: React.ReactNode }) => <div data-testid="popup-mock">{children}</div>,
  };
});

vi.mock('@/providers/ConfigProvider', () => ({
  useConfig: () => ({ mapboxToken: 'pk.test', apiUrl: '' }),
}));

type MockMapboxProps = {
  layers: { id: string }[];
  onClick?: (info: { object: unknown; layer: { id: string } }) => void;
  children?: React.ReactNode;
};

const mapboxCaptures: MockMapboxProps[] = [];

vi.mock('@/components/map/DeckMapboxMap', () => ({
  DeckMapboxMap: (props: MockMapboxProps) => {
    mapboxCaptures.push(props);
    return (
      <div data-testid="deck-mapbox-mock">
        <button
          type="button"
          data-testid="mock-pick-node"
          onClick={() =>
            props.onClick?.({
              object: nodeA,
              layer: { id: 'heatmap-nodes' },
            })
          }
        >
          pick
        </button>
        {props.children}
      </div>
    );
  },
}));

const nodeA: HeatmapNode = {
  node_id: 0x11a,
  node_id_str: '!0000011a',
  short_name: 'A',
  long_name: 'Node A',
  lat: 55.9,
  lng: -4.2,
};

const nodeB: HeatmapNode = {
  node_id: 0x11b,
  node_id_str: '!0000011b',
  short_name: 'B',
  long_name: 'Node B',
  lat: 55.95,
  lng: -4.15,
};

const edge: HeatmapEdge = {
  from_node_id: nodeA.node_id,
  to_node_id: nodeB.node_id,
  from_lng: -4.2,
  from_lat: 55.9,
  to_lng: -4.15,
  to_lat: 55.95,
  weight: 5,
  avg_snr: 4,
};

function layerIds(layers: { id: string }[]) {
  return layers.map((l) => l.id);
}

function lastCapture() {
  return mapboxCaptures[mapboxCaptures.length - 1];
}

describe('TracerouteHeatmapMap', () => {
  beforeEach(() => {
    mapboxCaptures.length = 0;
  });

  it('keeps arc layers after popup selection state (mock click / onClick)', () => {
    render(
      <MemoryRouter>
        <TracerouteHeatmapMap edges={[edge]} nodes={[nodeA, nodeB]} edgeMetric="packets" />
      </MemoryRouter>
    );

    expect(layerIds(lastCapture().layers)).toEqual(
      expect.arrayContaining(['heatmap-arcs-packets', 'heatmap-nodes'])
    );

    fireEvent.click(screen.getByTestId('mock-pick-node'));

    expect(layerIds(lastCapture().layers)).toEqual(
      expect.arrayContaining(['heatmap-arcs-packets', 'heatmap-nodes'])
    );
  });

  it('swaps arc layer id when edgeMetric changes but keeps node layers', () => {
    const { rerender } = render(
      <MemoryRouter>
        <TracerouteHeatmapMap edges={[edge]} nodes={[nodeA, nodeB]} edgeMetric="packets" />
      </MemoryRouter>
    );

    expect(lastCapture().layers.some((l) => l.id === 'heatmap-arcs-packets')).toBe(true);

    rerender(
      <MemoryRouter>
        <TracerouteHeatmapMap edges={[edge]} nodes={[nodeA, nodeB]} edgeMetric="snr" />
      </MemoryRouter>
    );

    expect(lastCapture().layers.some((l) => l.id === 'heatmap-arcs-snr')).toBe(true);
    expect(lastCapture().layers.some((l) => l.id === 'heatmap-nodes')).toBe(true);
  });
});
