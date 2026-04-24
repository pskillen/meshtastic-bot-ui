import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportedTimeFreshness } from './reported-time-stale';

describe('reportedTimeFreshness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns fresh when younger than warning threshold (inclusive boundary)', () => {
    expect(reportedTimeFreshness(new Date('2026-06-15T10:00:00.000Z'))).toBe('fresh');
    // Just under 24h old
    expect(reportedTimeFreshness(new Date('2026-06-14T12:00:00.001Z'))).toBe('fresh');
  });

  it('returns stale24h at exactly 24h and before danger threshold', () => {
    expect(reportedTimeFreshness(new Date('2026-06-14T12:00:00.000Z'))).toBe('stale24h');
    expect(reportedTimeFreshness(new Date('2026-06-14T11:59:59.000Z'))).toBe('stale24h');
    expect(reportedTimeFreshness(new Date('2026-06-10T12:00:00.000Z'))).toBe('stale24h');
    // Just under 7d old (still warning, not danger)
    expect(reportedTimeFreshness(new Date('2026-06-08T12:00:00.001Z'))).toBe('stale24h');
  });

  it('returns stale7d at exactly danger threshold and older', () => {
    expect(reportedTimeFreshness(new Date('2026-06-08T12:00:00.000Z'))).toBe('stale7d');
    expect(reportedTimeFreshness(new Date('2025-01-01T00:00:00.000Z'))).toBe('stale7d');
  });

  it('respects custom hour thresholds', () => {
    const opts = { warningAfterHours: 1, dangerAfterHours: 48 };
    // 30m ago → fresh
    expect(reportedTimeFreshness(new Date('2026-06-15T11:30:00.000Z'), opts)).toBe('fresh');
    // 2h ago → stale24h (warning)
    expect(reportedTimeFreshness(new Date('2026-06-15T10:00:00.000Z'), opts)).toBe('stale24h');
    // 3d ago → stale7d
    expect(reportedTimeFreshness(new Date('2026-06-12T12:00:00.000Z'), opts)).toBe('stale7d');
  });

  it('returns null for invalid date', () => {
    expect(reportedTimeFreshness('not-a-date')).toBe(null);
  });
});
