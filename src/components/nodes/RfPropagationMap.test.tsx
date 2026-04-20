import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import L from 'leaflet';
import { RfPropagationMap } from './RfPropagationMap';

vi.mock('@/hooks/useMapTileUrl', () => ({
  useMapTileUrl: () => ({
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: 'OSM',
  }),
}));

describe('RfPropagationMap', () => {
  it('calls L.imageOverlay with south-west and north-east corners from bounds', async () => {
    const spy = vi.spyOn(L, 'imageOverlay');
    render(
      <RfPropagationMap
        assetUrl="https://api.example.com/map.png"
        bounds={{ west: -4.5, south: 55.0, east: -4.0, north: 55.5 }}
      />
    );
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
    const [url, latLngBounds] = spy.mock.calls[0] as [string, [[number, number], [number, number]]];
    expect(url).toBe('https://api.example.com/map.png');
    expect(latLngBounds).toEqual([
      [55.0, -4.5],
      [55.5, -4.0],
    ]);
    spy.mockRestore();
  });

  it('shows empty state when not ready', () => {
    const { getByText } = render(<RfPropagationMap assetUrl={null} bounds={null} />);
    expect(getByText(/map not rendered yet/i)).toBeInTheDocument();
  });
});
