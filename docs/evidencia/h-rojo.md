# Lote H — compuerta «ver fallar» (T194)

Fecha: 2026-11-14. Las pruebas T192 y T193 se escribieron **antes** del código.
- `tests/unit/visualLayer.test.ts`: no cargaba (no existían `ScaleBar`, `MaturityIndexCard`, `ReviewStats` ni `src/domain/visual.ts`).
- `tests/e2e/ia-real-visual.spec.ts` (1280 px): **9 de 9 fallaron** (no existían las barras, la tarjeta, las cifras, los chips ni el promedio por pilar).
- Pruebas de la 001: no se tocó ninguna.
