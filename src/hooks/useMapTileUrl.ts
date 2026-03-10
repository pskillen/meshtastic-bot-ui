import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { getMapTileSource } from '@/lib/settings';
import { getMapTileUrlForSource, getMapTileAttributionForSource } from '@/lib/map-tiles';

/**
 * Returns the map tile URL and attribution based on user preference (localStorage)
 * and current theme. Listens for meshflow-settings-changed to react to Settings page updates.
 */
export function useMapTileUrl(): { url: string; attribution: string } {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [mapTileSource, setMapTileSource] = useState(getMapTileSource);

  useEffect(() => {
    const handler = () => setMapTileSource(getMapTileSource());
    window.addEventListener('meshflow-settings-changed', handler);
    return () => window.removeEventListener('meshflow-settings-changed', handler);
  }, []);

  const url = getMapTileUrlForSource(mapTileSource, isDark ?? false);
  const attribution = getMapTileAttributionForSource(mapTileSource);

  return { url, attribution };
}
