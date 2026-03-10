/**
 * Meshtastic role IDs and labels.
 * @see https://meshtastic.org/docs/development/protobufs/api/#radioconfig-userpreferences
 */
export const ROLE_LABELS: Record<number, string> = {
  0: 'CLIENT',
  1: 'CLIENT_MUTE',
  2: 'ROUTER',
  3: 'ROUTER_CLIENT',
  4: 'REPEATER',
  5: 'TRACKER',
  6: 'SENSOR',
  7: 'TAK',
  8: 'CLIENT_HIDDEN',
  9: 'LOST_AND_FOUND',
  10: 'TAK_TRACKER',
  11: 'ROUTER_LATE',
  12: 'CLIENT_BASE',
};

export function getRoleLabel(role: number | null | undefined): string | null {
  if (role == null) return null;
  return ROLE_LABELS[role] ?? `Role ${role}`;
}
