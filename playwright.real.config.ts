// Pruebas e2e del modo «IA real» (002): Vite en desarrollo (con su proxy a /api) + el servicio local con el cliente FALSO
// y un guion de pruebas. Sin red, sin clave y sin gasto. Una sola persona de prueba a la vez (el servicio guarda los
// archivos en memoria), por eso workers: 1. No lee server/.env: el servicio arranca sin --env-file.
import { readFileSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const WEB = 5174;
const SERVICE = 8787;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /ia-real.*\.spec\.ts/,
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: { baseURL: `http://localhost:${WEB}` },
  webServer: [
    {
      command: 'node --import tsx src/index.ts',
      cwd: 'server',
      url: `http://127.0.0.1:${SERVICE}/api/health`,
      // Nunca reutilizar un servicio ya abierto: podría ser el real (con clave y costo).
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        ...(process.env as Record<string, string>),
        MODEL_PROVIDER: 'fake',
        OPENAI_MODEL_DIAGNOSTICO: 'modelo-falso-e2e',
        ALLOWED_ORIGINS: `http://localhost:${WEB},http://127.0.0.1:${WEB}`,
        // El servicio no lee archivos (AG-026): el guion le llega como texto en el entorno.
        FAKE_SCRIPT: readFileSync('tests/e2e/fixtures/guion-servicio.json', 'utf8'),
      },
    },
    {
      command: `npx vite --port ${WEB} --strictPort --host localhost`,
      url: `http://localhost:${WEB}`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
  projects: [
    { name: '320', use: { browserName: 'chromium', viewport: { width: 320, height: 640 } } },
    { name: '768', use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } } },
    { name: '1280', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
});
