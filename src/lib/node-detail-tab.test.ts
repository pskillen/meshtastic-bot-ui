import { describe, it, expect } from 'vitest';
import { isValidNodeDetailTab, parseNodeDetailTab } from './node-detail-tab';

describe('node-detail-tab', () => {
  it('parseNodeDetailTab returns overview for null', () => {
    expect(parseNodeDetailTab(null)).toBe('overview');
  });

  it('parseNodeDetailTab returns known tabs', () => {
    expect(parseNodeDetailTab('map')).toBe('map');
    expect(parseNodeDetailTab('traceroutes')).toBe('traceroutes');
    expect(parseNodeDetailTab('statistics')).toBe('statistics');
    expect(parseNodeDetailTab('monitoring')).toBe('monitoring');
    expect(parseNodeDetailTab('overview')).toBe('overview');
  });

  it('parseNodeDetailTab falls back for unknown values', () => {
    expect(parseNodeDetailTab('nope')).toBe('overview');
    expect(parseNodeDetailTab('')).toBe('overview');
  });

  it('isValidNodeDetailTab', () => {
    expect(isValidNodeDetailTab('map')).toBe(true);
    expect(isValidNodeDetailTab(null)).toBe(false);
    expect(isValidNodeDetailTab('bad')).toBe(false);
  });
});
