# Lote H2 — compuerta «ver fallar» (T206)

Fecha: 2026-11-14. Las pruebas T205 se escribieron **antes** del código.
- `tests/unit/visualRedesign.test.ts`: **7 fallos** (no existían la composición en dos columnas, el eje compartido ni el rótulo unido al encabezado).
- `tests/e2e/ia-real-rediseno.spec.ts` (1280 px): **10 de 10 fallaron** (la lista de barras, las rejillas, la barra lateral, las etiquetas, el movimiento…).
- Pruebas de la 001: no se tocó ninguna.
