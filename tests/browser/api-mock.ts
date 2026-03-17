import type { BrowserContext, Page, Route } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

export function loadFixture(name: string): unknown {
  const filePath = path.join(FIXTURES_DIR, name);
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

export function createJsonHandler(body: unknown, status = 200) {
  return (route: Route) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

export function createPaginatedHandler<T>(results: T[]) {
  return createJsonHandler({
    results,
    count: results.length,
    next: null,
    previous: null,
  });
}

export type RouteHandler = (route: Route) => Promise<void> | void;

const DEFAULT_HANDLERS: Array<{ pattern: string | RegExp; handler: RouteHandler }> = [
  // Order of handlers is important. The last registered handler is the first to run.
  // nested routes must be registered after the parent route.
  ['**/config.json', createJsonHandler(loadFixture('config.json'))],
  ['**/api/auth/user/**', createJsonHandler(loadFixture('auth-user.json'))],
  ['**/api/nodes/observed-nodes/**', createJsonHandler(loadFixture('observed-nodes.json'))],
  ['**/api/nodes/observed-nodes/recent_counts/**', createJsonHandler(loadFixture('observed-nodes-recent-counts.json'))],
  ['**/api/nodes/managed-nodes/**', createJsonHandler(loadFixture('managed-nodes.json'))],
  ['**/api/constellations/**', createJsonHandler(loadFixture('constellations.json'))],
  ['**/api/stats/global/**', createJsonHandler(loadFixture('stats-global.json'))],
  [
    '**/api/stats/snapshots/**',
    (route: Route) => {
      const url = route.request().url();
      const fixture = url.includes('packet_volume') ? 'stats-snapshots-packet-volume.json' : 'stats-snapshots.json';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(loadFixture(fixture)),
      });
    },
  ],
  ['**/ws/**', (route) => route.abort()],
].map(([pattern, handler]) => ({ pattern: pattern as string | RegExp, handler: handler as RouteHandler }));

type RouteTarget = Page | BrowserContext;

export async function installApiMocks(
  target: RouteTarget,
  overrides: Record<string, RouteHandler> = {}
): Promise<void> {
  const entries: Array<[string | RegExp, RouteHandler]> = DEFAULT_HANDLERS.map(({ pattern, handler }) => [
    pattern,
    handler,
  ]);
  for (const [pattern, handler] of Object.entries(overrides)) {
    entries.push([pattern, handler]);
  }

  for (const [pattern, handler] of entries) {
    await target.route(pattern, handler);
  }
}
