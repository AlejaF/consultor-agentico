# Lote H2 — mutaciones (T212)

Cada mutación se aplicó, se corrieron las pruebas y el archivo se restauró (`diff` idéntico).

| # | Mutación | Archivo | Resultado |
|---|---|---|---|
| M1 | Dibujar «1 de 5» en una dimensión sin evidencia (fila compacta) | `src/components/ScaleBar.tsx` | **Detectada** (3 pruebas unitarias) |
| M2 | El informe imprimible no abre los detalles | `src/components/PrintReport.tsx` | **Detectada solo por la prueba de pantalla** «impresión…» (las unitarias no ven `PrintReport`) |
| M3 | Quitar el rótulo de IA del encabezado del bloque | `src/components/MaturityPanel.tsx` | **Detectada** (1 prueba unitaria) |

Capturas (datos ficticios del guion de prueba): `docs/evidencia/h2-{proyectos,diagnostico,revision,informe,estrategia,tablero}-{320,768,1280}.png`. Se regeneran con `CAPTURAS=1 npx playwright test -c playwright.real.config.ts tests/e2e/ia-real-capturas-h2.spec.ts`.
