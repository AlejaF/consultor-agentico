# Lote N — compuerta «ver fallar» (T182)

Fecha: 2026-11-14. Las pruebas T179, T180 y T181 se escribieron **antes** del código.
- `tests/unit/createdProjects.test.ts` y `tests/server/empresa-dato.test.ts`: no cargaban (no existían `src/domain/createdProjects.ts` ni `server/src/agent/empresa.ts`). Además falló 1 prueba ajustada de `empresa-contexto.test.ts` (el nombre aún no iba en `<empresa>`).
- `tests/e2e/ia-real-nuevo-proyecto.spec.ts` (1280 px): **10 de 10 fallaron** (no existía el botón «+ Nuevo proyecto»).
- Pruebas de la 001: no se tocó ninguna.
