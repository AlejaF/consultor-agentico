# Lote H3 — compuerta «ver fallar» (T219)

- **Unitarias** (`tests/unit/charts.test.ts`): escritas ANTES del módulo; fallaron por completo (el módulo `src/domain/charts.ts` no existía). Después, 18 en verde. `tests/unit/chartsView.test.ts` (8) se escribió junto con los componentes.
- **De pantalla** (`tests/e2e/ia-real-h3.spec.ts`): **no se vieron fallar antes de implementar**: se escribieron después de la primera versión de la composición, mientras se medía. Lo que sí hay: la línea base de H2 medida antes de cambiar nada (`h3-base-h2.json`: 2888 px, madurez 762 px, 1 tarjeta por fila) y la mutación M3 (volver a una columna) que hace fallar el criterio de altura (2246 px). Se declara aquí para no aparentar más de lo hecho.
- Pruebas de la 001: no se tocó ninguna.
