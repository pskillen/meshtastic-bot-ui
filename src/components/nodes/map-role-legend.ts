import { ROLE_COLORS } from './map-utils';
import { ROLE_LABELS } from '@/lib/meshtastic';

const UNKNOWN_COLOR = '#64748b';

export type RoleLegendSwatch = { key: string; label: string; color: string };

/** Swatches matching `getRoleColor` / map marker role semantics. */
export function meshRoleLegendSwatches(): RoleLegendSwatch[] {
  const sw: RoleLegendSwatch[] = (Object.keys(ROLE_COLORS) as string[]).map((k) => {
    const id = Number(k);
    return {
      key: `role-${id}`,
      label: ROLE_LABELS[id] ?? `Role ${id}`,
      color: ROLE_COLORS[id as keyof typeof ROLE_COLORS],
    };
  });
  sw.push({ key: 'role-unknown', label: 'Unknown / other', color: UNKNOWN_COLOR });
  return sw;
}
