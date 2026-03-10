import { useTheme } from 'next-themes';

/**
 * Returns whether the current theme is dark, for map tile selection.
 * Uses resolvedTheme to handle system preference.
 */
export function useMapTheme(): boolean {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark';
}
