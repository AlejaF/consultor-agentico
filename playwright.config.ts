import { defineConfig } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  // Las pruebas del modo IA real (servicio local en modo falso) corren con playwright.real.config.ts, sin tocar esta configuración (SC-A5).
  testIgnore: /ia-real.*\.spec\.ts/,
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: '320', use: { browserName: 'chromium', viewport: { width: 320, height: 640 } } },
    { name: '768', use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } } },
    { name: '1280', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
});
