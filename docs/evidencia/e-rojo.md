# Lote E — compuerta «ver fallar» (T100D)

Fecha: 2026-11-14. Las pruebas T097, T098, T099, T100, T100A, T100B y T100C se escribieron **antes** del código y se ejecutaron contra el código del lote D3.

## Vitest (5 archivos nuevos)
- `tests/server/tools-strategy.test.ts`, `tests/unit/realStrategyGuards.test.ts`: no cargaban (no existía `server/src/agent/strategy.ts` ni `src/domain/realStrategy.ts`).
- `tests/unit/realStrategy.test.ts`: tampoco cargaba (faltaban `realStrategyTemplate` y `getStrategy`).
- `tests/server/strategy-route.test.ts` y `strategy-security.test.ts`: **13 fallos**, todos por el mismo motivo esperado: `POST /api/strategy/run` respondía 404 (la ruta no existía).

## Playwright (`ia-real-estrategia.spec.ts`, 1280 px)
- **6 fallos, 1 pasa**. Los 6 fallos: no existía el botón «Generar estrategia» en modo real (la pantalla decía «aún no disponible»), ni el aviso «sin respaldo», ni «Estrategia real no disponible».
- Pasa desde el principio, a propósito: «el modo Simulado y su Estrategia ficticia no cambian» (protege el punto 7; no puede fallar antes porque lo vigila).

## Pruebas de la 001
No se tocó ninguna.
