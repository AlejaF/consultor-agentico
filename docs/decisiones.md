# Registro de decisiones

## Estado de la sesión

- **Inicio de L1 (agente)**: 2026-11-01 15:34 (UTC-5).
- Cierre de L1: pendiente (se completa en T017).

## Decisiones de L1

- `vite.config.ts` lleva `passWithNoTests: true` de forma **provisional**: sin él, `npm test` falla en CI en el primer despliegue (T003) porque aún no hay pruebas. Se retira en T017.
