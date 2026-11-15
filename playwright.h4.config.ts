// Pruebas e2e del Resumen/Detalle (AG-036, lote H4): igual que playwright.real.config.ts (Vite + servicio con el cliente FALSO,
// sin red, sin clave y sin gasto) pero SIN fijar VITE_VISTA_INICIAL: la vista por defecto es la de producción («resumen»).
// Las suites de la 001 y de la 002 corren con «detalle» por defecto (playwright.config.ts y playwright.real.config.ts).
import { readFileSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const WEB = 5175;
const SERVICE = 8787;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /ia-real-h4-.*\.spec\.ts/,
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: { baseURL: `http://localhost:${WEB}`, reducedMotion: 'reduce' },
  webServer: [
    {
      command: 'node --import tsx src/index.ts',
      cwd: 'server',
      url: `http://127.0.0.1:${SERVICE}/api/health`,
      reuseExistingServer: false, // nunca reutilizar un servicio ya abierto: podría ser el real
      timeout: 60_000,
      env: {
        ...(process.env as Record<string, string>),
        MODEL_PROVIDER: 'fake',
        OPENAI_MODEL_DIAGNOSTICO: 'modelo-falso-e2e',
        OPENAI_MODEL_ESTRATEGIA: 'modelo-falso-e2e',
        ALLOWED_ORIGINS: `http://localhost:${WEB},http://127.0.0.1:${WEB}`,
        FAKE_SCRIPT: readFileSync('tests/e2e/fixtures/guion-servicio.json', 'utf8'),
      },
    },
    {
      command: `npx vite --port ${WEB} --strictPort --host localhost`,
      url: `http://localhost:${WEB}`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { ...(process.env as Record<string, string>), VITE_VISTA_INICIAL: '' }, // vacío = producción («resumen»)
    },
  ],
  projects: [
    { name: '320', use: { browserName: 'chromium', viewport: { width: 320, height: 640 } } },
    { name: '768', use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } } },
    { name: '1280', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
});
