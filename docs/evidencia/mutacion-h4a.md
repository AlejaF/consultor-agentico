# Mutaciones H4a (cada una debe hacer fallar una prueba; luego se restaura el archivo)

Archivo mutado: `src/components/DiagnosisResumen.tsx` (restaurado; `diff` idéntico a la copia previa). Pruebas: `tests/e2e/ia-real-h4-resumen.spec.ts` con `playwright.h4.config.ts`.

| # | Mutación | Prueba que falló | Mensaje |
|---|---|---|---|
| M1 | Mostrar la traza (contenido técnico) en el Resumen | «lo técnico (traza, modelo, tokens) no está en el Resumen…» | «el Resumen del Consultor no debe traer «trace-view»» |
| M2 | Dibujar «2 de 5» y relleno en los pilares sin evidencia | «barras por pilar: los respaldados llevan número y los demás no dibujan ninguno» | no queda ningún pilar sin número («hay pilares sin evidencia en el escenario de prueba»: 0) |
| M3 | El botón «Ver los N hallazgos» apunta al Detalle sin su sección | «los 4 botones llevan al Detalle posicionado…» | la dirección esperada `…/detalle/hallazgos` no coincide |

Nota sobre M1: la Empresa no puede abrir Diagnóstico (la ruta la redirige a su inicio), así que la comprobación efectiva está en el Resumen del Consultor; la prueba además verifica que la Empresa, al pedir `…/resumen` o `…/detalle`, termina en `#/contacto` sin ningún marcador técnico en el DOM.
