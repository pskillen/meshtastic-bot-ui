import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRecencyRelative } from './reported-time-format';

describe('formatRecencyRelative', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns fallback for null/undefined', () => {
    expect(formatRecencyRelative(null)).toBe('—');
    expect(formatRecencyRelative(undefined, 'Never')).toBe('Never');
  });

  it('returns fallback for invalid', () => {
    expect(formatRecencyRelative('bad')).toBe('—');
  });

  it('formats valid dates with suffix', () => {
    const s = formatRecencyRelative(new Date('2026-06-15T11:00:00.000Z'));
    expect(s.length).toBeGreaterThan(0);
    expect(s).toMatch(/ago|in /);
  });
});
