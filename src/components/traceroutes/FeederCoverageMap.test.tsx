import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { render } from '@testing-library/react';

import type { FeederRange } from '@/hooks/api/useFeederRanges';

import { FeederCoverageMap } from './FeederCoverageMap';

vi.mock('@/providers/ConfigProvider', () => ({
  useConfig: () => ({ mapboxToken: 'pk.test', apiUrl: '' }),
}));
vi.mock('@/hooks/useMapboxStyle', () => ({
  useMapboxStyle: () => 'mapbox://styles/mapbox/light-v11',
}));
vi.mock('react-map-gl', () => ({
  Map: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  useControl: vi.fn(() => ({ setProps: vi.fn() })),
  useMap: () => ({ current: null }),
}));

interface ScatterCall {
  id: string | undefined;
  data: unknown[];
  getRadius?: ((d: unknown) => number) | number;
  getFillColor?: ((d: unknown) => unknown) | unknown;
  getLineColor?: ((d: unknown) => unknown) | unknown;
  getLineWidth?: ((d: unknown) => number) | number;
  radiusUnits?: string;
}

const scatterCalls: ScatterCall[] = [];

vi.mock('@deck.gl/layers', () => {
  class ScatterplotLayer {
    props: ScatterCall;
    constructor(props: ScatterCall & { data: unknown[] }) {
      this.props = props;
      scatterCalls.push(props);
    }
  }
  class TextLayer {
    constructor(public props: unknown) {}
  }
  return { ScatterplotLayer, TextLayer };
});

vi.mock('@deck.gl/mapbox', () => ({
  MapboxOverlay: class {
    constructor(public props: unknown) {}
    setProps() {}
  },
}));

function makeFeeder(args: { node_id: number } & Partial<Omit<FeederRange, 'node_id'>>): FeederRange {
  const { node_id, ...overrides } = args;
  return {
    managed_node_id: `mn-${node_id}`,
    node_id,
    node_id_str: `!${node_id.toString(16).padStart(8, '0')}`,
    short_name: `F${node_id}`,
    long_name: `Feeder ${node_id}`,
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

function renderMap(props: Parameters<typeof FeederCoverageMap>[0]) {
  return render(
    <MemoryRouter>
      <FeederCoverageMap {...props} />
    </MemoryRouter>
  );
}

function getCircleLayer(): ScatterCall | undefined {
  return scatterCalls.find((c) => c.id === 'feeder-circles');
}

describe('FeederCoverageMap', () => {
  beforeEach(() => {
    scatterCalls.length = 0;
  });
  afterEach(() => {
    scatterCalls.length = 0;
  });

  it('uses the chosen percentile (in metres) for the circle radius', () => {
    const feeder = makeFeeder({ node_id: 1 });
    renderMap({
      feeders: [feeder],
      metric: 'p95',
      mode: 'direct',
      showLowConfidence: false,
    });

    const circle = getCircleLayer();
    expect(circle).toBeDefined();
    expect(circle!.radiusUnits).toBe('meters');
    expect(circle!.data).toHaveLength(1);
    const row = (circle!.data as Array<{ feeder: FeederRange; radiusKm: number | null }>)[0];
    expect(row.radiusKm).toBe(10); // p95 direct
    const r = (circle!.getRadius as (d: unknown) => number)(row);
    expect(r).toBe(10_000); // metres
  });

  it('switches to "any" block when mode=any', () => {
    const feeder = makeFeeder({ node_id: 1 });
    renderMap({ feeders: [feeder], metric: 'max', mode: 'any', showLowConfidence: false });
    const circle = getCircleLayer();
    const row = (circle!.data as Array<{ radiusKm: number | null }>)[0];
    expect(row.radiusKm).toBe(40); // any.max_km
  });

  it('hides low-confidence feeders by default and reveals them when toggled on', () => {
    const lowConf = makeFeeder({
      node_id: 2,
      direct: {
        sample_count: 3,
        p50_km: 1,
        p90_km: 1.5,
        p95_km: 2,
        max_km: 3,
        low_confidence: true,
      },
    });
    const ok = makeFeeder({ node_id: 1 });

    renderMap({ feeders: [ok, lowConf], metric: 'p95', mode: 'direct', showLowConfidence: false });
    const hiddenCircle = getCircleLayer();
    expect(hiddenCircle!.data).toHaveLength(1);

    scatterCalls.length = 0;

    renderMap({ feeders: [ok, lowConf], metric: 'p95', mode: 'direct', showLowConfidence: true });
    const shownCircle = getCircleLayer();
    expect(shownCircle!.data).toHaveLength(2);

    // Low-confidence row should be styled differently (thinner stroke).
    const rows = shownCircle!.data as Array<{ feeder: FeederRange }>;
    const widths = rows.map((r) => (shownCircle!.getLineWidth as (d: unknown) => number)(r));
    expect(widths).toContain(1);
    expect(widths).toContain(2);
  });

  it('drops feeders that have no samples for the active mode', () => {
    const feeder = makeFeeder({
      node_id: 3,
      direct: {
        sample_count: 0,
        p50_km: null,
        p90_km: null,
        p95_km: null,
        max_km: null,
        low_confidence: true,
      },
    });
    renderMap({ feeders: [feeder], metric: 'p95', mode: 'direct', showLowConfidence: true });
    const circle = getCircleLayer();
    expect(circle).toBeUndefined();
  });
});
