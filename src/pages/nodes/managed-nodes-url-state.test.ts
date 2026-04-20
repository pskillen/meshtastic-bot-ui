import { describe, expect, it } from 'vitest';

import { parseManagedNodesUrlState, updateManagedNodesUrlState } from './managed-nodes-url-state';

describe('managed-nodes-url-state', () => {
  it('parses valid values and ignores invalid entries', () => {
    const params = new URLSearchParams(
      'constellation=1,abc,2&status=online,invalid,offline&owner=alice,bob&q=  west  &auto_tr=1&sort=name_asc'
    );
    const parsed = parseManagedNodesUrlState(params);
    expect(parsed.constellationIds).toEqual([1, 2]);
    expect(parsed.statusTiers).toEqual(['online', 'offline']);
    expect(parsed.ownerUsernames).toEqual(['alice', 'bob']);
    expect(parsed.query).toBe('west');
    expect(parsed.allowAutoTraceroute).toBe(true);
    expect(parsed.sort).toBe('name_asc');
  });

  it('keeps unknown params when applying patches', () => {
    const initial = new URLSearchParams('foo=bar&status=online&sort=name_desc');
    const next = updateManagedNodesUrlState(initial, {
      statusTiers: ['stale', 'offline'],
      query: ' feeder ',
      allowAutoTraceroute: false,
    });
    expect(next.get('foo')).toBe('bar');
    expect(next.get('status')).toBe('stale,offline');
    expect(next.get('q')).toBe('feeder');
    expect(next.get('auto_tr')).toBe('0');
    expect(next.get('sort')).toBe('name_desc');
  });

  it('clears fields when patch sets empty values', () => {
    const initial = new URLSearchParams('owner=alice&q=abc&auto_tr=1');
    const next = updateManagedNodesUrlState(initial, {
      ownerUsernames: [],
      query: '',
      allowAutoTraceroute: null,
    });
    expect(next.has('owner')).toBe(false);
    expect(next.has('q')).toBe(false);
    expect(next.has('auto_tr')).toBe(false);
  });
});
