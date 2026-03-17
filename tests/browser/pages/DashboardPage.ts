import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page, '/');
  }

  get recentlyActiveNodesHeading() {
    return this.page.getByText('Recently Active Nodes');
  }

  get meshflowMapHeading() {
    return this.page.getByText('Meshflow Map');
  }

  get meshActivityHeading() {
    return this.page.getByText('Mesh Activity');
  }

  get nodeActivityHeading() {
    return this.page.getByText('Node Activity');
  }

  get nodesPageLink() {
    return this.page.getByRole('link', { name: /nodes page/i });
  }

  get recentlyActiveNodesTable() {
    return this.recentlyActiveNodesHeading.locator('..').locator('..').locator('table');
  }

  async expectLoaded() {
    await expect(this.recentlyActiveNodesHeading).toBeVisible();
    await expect(this.meshflowMapHeading).toBeVisible();
    await expect(this.meshActivityHeading).toBeVisible();
    await expect(this.nodeActivityHeading).toBeVisible();
  }

  async expectNodeCounts(values: (string | number)[]) {
    const section = this.page.getByTestId('dashboard-recently-active-nodes');
    for (const value of values) {
      await expect(section.getByText(String(value), { exact: true })).toBeVisible();
    }
  }

  async expectNodeActivityTableEmpty() {
    await expect(this.page.getByText(/no nodes found/i)).toBeVisible();
  }

  async expectNodeActivityTableHasNodes(count?: number) {
    const table = this.page.getByRole('table').filter({ has: this.page.getByText('Node Name') });
    await expect(table).toBeVisible();
    if (count !== undefined && count > 0) {
      await expect(table.getByRole('row')).toHaveCount(count + 1);
    }
  }

  async clickNodesPageLink() {
    await this.nodesPageLink.click();
  }
}
