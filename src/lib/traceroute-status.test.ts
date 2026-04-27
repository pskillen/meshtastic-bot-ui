import { describe, it, expect } from 'vitest';
import { tracerouteStatusLabel } from './traceroute-status';

describe('tracerouteStatusLabel', () => {
  it('maps API statuses to user-facing labels', () => {
    expect(tracerouteStatusLabel('pending')).toBe('Queued');
    expect(tracerouteStatusLabel('sent')).toBe('In flight');
    expect(tracerouteStatusLabel('completed')).toBe('Completed');
    expect(tracerouteStatusLabel('failed')).toBe('Failed');
  });
});
