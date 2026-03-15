import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { getMapTileSource } from '@/lib/settings';
import { getMapboxStyleForSource } from '@/lib/map-tiles';

/**
 * Returns the Mapbox map style URL based on user preference (localStorage)
 * and current theme. Listens for meshflow-settings-changed to react to Settings page updates.
 */
export function useMapboxStyle(): string {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [mapTileSource, setMapTileSource] = useState(getMapTileSource);

  useEffect(() => {
    const handler = () => setMapTileSource(getMapTileSource());
    window.addEventListener('meshflow-settings-changed', handler);
    return () => window.removeEventListener('meshflow-settings-changed', handler);
  }, []);

  return getMapboxStyleForSource(mapTileSource, isDark ?? false);
}
