# Lote H — mutaciones (T200)

Cada mutación se aplicó, se corrieron las pruebas y el archivo se restauró (`diff` idéntico).

| # | Mutación | Archivo | Resultado |
|---|---|---|---|
| M1 | Dibujar «1 de 5» en una dimensión sin evidencia | `src/components/ScaleBar.tsx` | **Detectada** (2 pruebas unitarias y la prueba de pantalla «madurez: barras…») |
| M2 | El nivel 1 deja de ser «Bajo (<2)» | `src/domain/visual.ts` | **Detectada** (1 prueba unitaria) |
| M3 | La tarjeta sin índice dibuja «0,0 de 5» | `src/components/MaturityIndexCard.tsx` | **Detectada** (1 prueba unitaria) |

Capturas (datos ficticios del guion de prueba): `docs/evidencia/h-revision-*.png`, `h-estrategia-*.png`, `h-tablero-*.png`, `h-ejemplo-simulado-*.png` en 320, 768 y 1280 px. Se regeneran con `CAPTURAS=1 npx playwright test -c playwright.real.config.ts tests/e2e/ia-real-capturas-h.spec.ts`.
