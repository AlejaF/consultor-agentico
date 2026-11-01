import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    passWithNoTests: true, // provisional: permite el primer despliegue (T003) antes de existir pruebas; se quita en T017
  },
});
