import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  // El proxy lo llevan `vite` y también `vite preview` (hereda `server.proxy`), pero NO `vite build`: el sitio publicado
  // (archivos estáticos) no apunta a ningún servicio local y allí «IA real» figura no disponible (principio II).
  server: {
    proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false } },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/server/**/*.test.ts', 'tests/cross/**/*.test.ts'],
  },
});
