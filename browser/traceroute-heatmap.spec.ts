import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const heatmapFixture = JSON.parse(readFileSync(path.join(__dirname, 'fixtures', 'heatmap-edges.json'), 'utf-8'));

test.describe('Traceroute Heatmap', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/traceroutes/heatmap-edges/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(heatmapFixture) })
    );
  });

  test('heatmap page loads with mock data', async ({ page }) => {
    await page.goto('/traceroutes/heatmap');

    await expect(page.getByRole('heading', { name: /traceroute heatmap/i })).toBeVisible();
    await expect(page.getByTestId('heatmap-filters')).toBeVisible();
    await expect(page.getByTestId('heatmap-map')).toBeVisible();

    await expect(page.getByText(/failed to load/i)).not.toBeVisible();

    await expect(page.getByText('Active Nodes: 3')).toBeVisible();
    await expect(page.getByText('Total Trace Routes: 10')).toBeVisible();
  });

  test('arc lines remain visible after toggling node labels', async ({ page }) => {
    await page.goto('/traceroutes/heatmap');

    const mapContainer = page.getByTestId('heatmap-map-container');
    await expect(mapContainer).toBeVisible();

    const canvas = mapContainer.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    const labelsSwitch = page.getByRole('switch', { name: /node labels/i });
    await expect(labelsSwitch).toBeVisible();

    await labelsSwitch.click();
    await expect(labelsSwitch).toBeChecked({ checked: false });

    await expect(mapContainer.locator('canvas').first()).toBeVisible();
    await expect(mapContainer).toHaveCount(1);

    await labelsSwitch.click();
    await expect(labelsSwitch).toBeChecked({ checked: true });

    await expect(mapContainer.locator('canvas').first()).toBeVisible();
  });

  test('node click opens popup', async ({ page }) => {
    await page.goto('/traceroutes/heatmap');

    await expect(page.getByTestId('heatmap-map-container')).toBeVisible({ timeout: 15_000 });

    const mapContainer = page.getByTestId('heatmap-map-container');
    const canvas = mapContainer.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    await canvas.click({ position: { x: 200, y: 200 } });

    const popup = page.getByTestId('node-popup');
    await expect(popup).toBeVisible({ timeout: 5_000 });
    await expect(popup.getByText(/node a|node b|node c|!a1b2c3d4|!b2c3d4e5|!c3d4e5f6/i)).toBeVisible();
    await expect(popup.getByRole('link', { name: /open details/i })).toBeVisible();
  });

  test('popup closes on close button', async ({ page }) => {
    await page.goto('/traceroutes/heatmap');

    await expect(page.getByTestId('heatmap-map-container')).toBeVisible({ timeout: 15_000 });

    const mapContainer = page.getByTestId('heatmap-map-container');
    const canvas = mapContainer.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    await canvas.click({ position: { x: 200, y: 200 } });

    const popup = page.getByTestId('node-popup');
    await expect(popup).toBeVisible({ timeout: 5_000 });

    await popup.getByRole('button', { name: /close/i }).click();

    await expect(popup).not.toBeVisible();
  });
});
