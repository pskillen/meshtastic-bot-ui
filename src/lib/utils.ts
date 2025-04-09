import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a Meshtastic ID (integer form) to hex representation (!abcdef12)
 */
export function meshtasticIdToHex(meshtasticId: number): string {
  const BROADCAST_ID = 0xffffffff;

  if (meshtasticId === BROADCAST_ID) {
    return '^all';
  }

  return `!${meshtasticId.toString(16).padStart(8, '0')}`;
}
