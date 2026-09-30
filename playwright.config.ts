import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests/e2e',
  retries: 0,
  forbidOnly: true,
  snapshotPathTemplate: '{testDir}/visual-baselines/{projectName}/{arg}{ext}',
  expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixels: 0 } },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', testIgnore: '**/touch-responsive.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 }, locale: 'en-US', timezoneId: 'UTC' } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'], viewport: { width: 393, height: 727 }, locale: 'en-US', timezoneId: 'UTC' } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort',
        url: baseURL,
        reuseExistingServer: false,
      },
});
