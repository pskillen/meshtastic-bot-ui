/** Shared reliability ramp and dot sizing for traceroute coverage maps. */

export const LOW_CONFIDENCE_COLOR: [number, number, number, number] = [148, 163, 184, 140];

export function smoothedRate(successes: number, attempts: number): number {
  return (successes + 1) / (attempts + 2);
}

/** Map a smoothed reliability (0..1) to red→amber→green. */
export function reliabilityColor(rate: number, alpha = 220): [number, number, number, number] {
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

/** Scale attempts to a pixel radius, clamped to [6, 30]. */
export function attemptsToRadius(attempts: number): number {
  return Math.max(6, Math.min(30, 6 + Math.sqrt(attempts) * 3));
}
