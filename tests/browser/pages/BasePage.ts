import { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(
    protected readonly page: Page,
    protected readonly path: string
  ) {}

  async goto() {
    await this.page.goto(this.path);
  }
}
