import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  // El proxy solo existe en desarrollo (`vite`): ni `vite build` ni `vite preview` lo llevan, así que el sitio
  // publicado no apunta a ningún servicio local (principio II).
  server: {
    proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false } },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/server/**/*.test.ts'],
  },
});
