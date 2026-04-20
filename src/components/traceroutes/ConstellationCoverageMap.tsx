import { useCallback, useMemo, useState } from 'react';
import { Popup } from 'react-map-gl';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import type { Layer, PickingInfo } from '@deck.gl/core';
import { X } from 'lucide-react';

import { DeckMapboxMap } from '@/components/map/DeckMapboxMap';
import type { ConstellationCoverageHex } from '@/lib/api/meshtastic-api';

const DEFAULT_CENTER = { longitude: -4.2518, latitude: 55.8642, zoom: 7 };
const LOW_CONFIDENCE_COLOR: [number, number, number, number] = [148, 163, 184, 140];

export interface SmoothedHex extends ConstellationCoverageHex {
  smoothed: number;
}

function smoothedRate(successes: number, attempts: number): number {
  return (successes + 1) / (attempts + 2);
}

function reliabilityColor(rate: number, alpha = 160): [number, number, number, number] {
  const t = Math.max(0, Math.min(1, rate));
  let r: number;
  let g: number;
  let b: number;
  if (t < 0.7) {
    const k = t / 0.7;
    r = Math.round(239 + (245 - 239) * k);
    g = Math.round(68 + (158 - 68) * k);
    b = Math.round(68 + (11 - 68) * k);
  } else {
    const k = Math.min(1, (t - 0.7) / 0.2);
    r = Math.round(245 + (34 - 245) * k);
    g = Math.round(158 + (197 - 158) * k);
    b = Math.round(11 + (94 - 11) * k);
  }
  return [r, g, b, alpha];
}

export interface ConstellationCoverageMapProps {
  hexes: ConstellationCoverageHex[];
  minAttempts: number;
}

export function ConstellationCoverageMap({ hexes, minAttempts }: ConstellationCoverageMapProps) {
  const [selectedHex, setSelectedHex] = useState<SmoothedHex | null>(null);

  const smoothedHexes: SmoothedHex[] = useMemo(
    () =>
      hexes.map((h) => ({
        ...h,
        smoothed: smoothedRate(h.successes, h.attempts),
      })),
    [hexes]
  );

  const layer = useMemo(() => {
    if (smoothedHexes.length === 0) return null;
    return new H3HexagonLayer<SmoothedHex>({
      id: 'constellation-coverage-hex',
      data: smoothedHexes,
      getHexagon: (d) => d.h3_index,
      extruded: false,
      stroked: true,
      filled: true,
      getFillColor: (d) => (d.attempts < minAttempts ? LOW_CONFIDENCE_COLOR : reliabilityColor(d.smoothed)),
      getLineColor: [15, 23, 42, 180],
      lineWidthMinPixels: 1,
      pickable: true,
    });
  }, [smoothedHexes, minAttempts]);

  const layers = useMemo(() => [layer].filter(Boolean) as Layer[], [layer]);

  const handleClick = useCallback((info: PickingInfo) => {
    if (info.object && info.layer?.id === 'constellation-coverage-hex') {
      setSelectedHex(info.object as SmoothedHex);
    } else {
      setSelectedHex(null);
    }
  }, []);

  return (
    <DeckMapboxMap
      layers={layers}
      initialViewState={DEFAULT_CENTER}
      onClick={handleClick}
      data-testid="constellation-coverage-map-container"
    >
      {selectedHex && (
        <Popup
          longitude={selectedHex.centre_lng}
          latitude={selectedHex.centre_lat}
          anchor="bottom"
          closeButton={false}
          closeOnClick={false}
          onClose={() => setSelectedHex(null)}
          maxWidth="320px"
          className="meshflow-map-popup"
        >
          <div className="relative min-w-[200px] rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-lg">
            <button
              type="button"
              onClick={() => setSelectedHex(null)}
              className="absolute right-1 top-1 rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
            <div className="pr-5">
              <div className="font-mono text-xs text-slate-400">{selectedHex.h3_index}</div>
              <div className="mt-1 text-xs">
                {selectedHex.successes} / {selectedHex.attempts} (
                {((selectedHex.attempts > 0 ? selectedHex.successes / selectedHex.attempts : 0) * 100).toFixed(0)}% raw)
              </div>
              <div className="text-xs">Smoothed: {(selectedHex.smoothed * 100).toFixed(0)}%</div>
              <div className="mt-1 text-xs text-slate-400">
                {selectedHex.contributing_feeders} feeder{selectedHex.contributing_feeders === 1 ? '' : 's'},{' '}
                {selectedHex.contributing_targets} target{selectedHex.contributing_targets === 1 ? '' : 's'}
              </div>
            </div>
          </div>
        </Popup>
      )}
    </DeckMapboxMap>
  );
}
