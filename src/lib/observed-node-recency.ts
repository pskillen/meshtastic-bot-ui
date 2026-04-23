import { subHours } from 'date-fns';

import type { ObservedNode } from '@/lib/models';

/** Pick-target map/search only list nodes heard at least this recently. */
export const PICK_TARGET_LAST_HEARD_HOURS = 48;

export function pickTargetLastHeardCutoff(now: Date = new Date()): Date {
  return subHours(now, PICK_TARGET_LAST_HEARD_HOURS);
}

function toTime(value: Date | string | null | undefined): number | null {
  if (value == null) return null;
  const t = value instanceof Date ? value : new Date(value);
  return Number.isNaN(t.getTime()) ? null : t.getTime();
}

/** True if the node has a known last_heard on or after `cutoff` (inclusive). */
export function observedNodeHeardOnOrAfter(node: ObservedNode, cutoff: Date): boolean {
  const t = toTime(node.last_heard);
  if (t == null) return false;
  return t >= cutoff.getTime();
}
