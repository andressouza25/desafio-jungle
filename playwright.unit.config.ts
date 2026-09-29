import { defineConfig } from '@playwright/test';

// These tests use no browser fixtures or server. Reuse the installed test runner.
export default defineConfig({
  testDir: './tests/unit',
  outputDir: './test-results/unit',
  reporter: 'list',
  projects: [{ name: 'unit' }],
});
