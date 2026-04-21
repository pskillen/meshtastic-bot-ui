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

  it('returns fresh within 24h', () => {
    expect(reportedTimeFreshness(new Date('2026-06-15T10:00:00.000Z'))).toBe('fresh');
    expect(reportedTimeFreshness(new Date('2026-06-14T12:00:00.000Z'))).toBe('fresh');
  });

  it('returns stale24h strictly after 24h and within 7d', () => {
    expect(reportedTimeFreshness(new Date('2026-06-14T11:59:59.000Z'))).toBe('stale24h');
    expect(reportedTimeFreshness(new Date('2026-06-10T12:00:00.000Z'))).toBe('stale24h');
  });

  it('returns stale7d strictly after 7 days', () => {
    expect(reportedTimeFreshness(new Date('2026-06-08T12:00:00.000Z'))).toBe('stale24h');
    expect(reportedTimeFreshness(new Date('2026-06-08T11:59:59.999Z'))).toBe('stale7d');
    expect(reportedTimeFreshness(new Date('2025-01-01T00:00:00.000Z'))).toBe('stale7d');
  });

  it('returns null for invalid date', () => {
    expect(reportedTimeFreshness('not-a-date')).toBe(null);
  });
});
