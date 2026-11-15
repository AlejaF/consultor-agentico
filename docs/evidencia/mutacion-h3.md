# Lote H3 — mutaciones (T226)

Cada mutación se aplicó, se corrieron las pruebas y el archivo se restauró (`diff` idéntico).

| # | Mutación | Archivo | Resultado |
|---|---|---|---|
| M1 | Dibujar el número en una celda sin evidencia del mapa de calor | `src/components/charts/index.tsx` | **Detectada** (`chartsView`: «una celda sin evidencia… NO lleva número») |
| M2 | Contar un hallazgo rechazado como vigente | `src/domain/charts.ts` | **Detectada** (2 pruebas: `charts` y `chartsView`) |
| M3 | Volver a una sola columna de hallazgos a 1280 px | `src/styles/h3.css` | **Detectada** (prueba de pantalla: altura 2246 px > 1877 px) |
