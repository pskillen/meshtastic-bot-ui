import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['junit', { outputFile: 'reports/browser-junit.xml' }]] : [['line']],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  timeout: 30_000,
  expect: { timeout: 60_000 },
  webServer: {
    command: 'npm run test:browser:dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.GITHUB_ACTIONS,
    timeout: 60_000,
  },
});
