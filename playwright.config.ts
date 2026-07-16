import { defineConfig, devices } from '@playwright/test';

/**
 * Configuracion central de Playwright para el challenge de automatizacion.
 * - Proyecto "e2e-ui": pruebas de interfaz sobre https://www.demoblaze.com
 * - Proyecto "api": pruebas de servicios REST sobre https://api.demoblaze.com
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'evidence/results.json' }],
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'e2e-ui',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.demoblaze.com',
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: 'https://api.demoblaze.com',
      },
    },
  ],
});
