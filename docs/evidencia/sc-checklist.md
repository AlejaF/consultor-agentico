# Checklist de criterios de éxito (SC-001 a SC-015)

Estado al cierre del lote L6, **antes** de las pruebas con usuarios y de la revisión manual (esas partes son de una persona). Leyenda: **Verificado (auto)** = lo comprueba una prueba automática que se ejecuta en local (`npm test`, `npm run test:e2e`); **NO VERIFICADO** = nadie lo ha comprobado todavía; **Indicativo (n = …)** = medido con una muestra demasiado pequeña para concluir; **No aplica todavía** = depende de una pantalla que no se construyó.

| SC | Resumen | Estado | Evidencia | Qué falta |
|---|---|---|---|---|
| SC-001 | Recorrido P1 completo en ≤ 10 min por una persona nueva | **NO VERIFICADO** | El recorrido funcional está cubierto por `tests/e2e/p1-journey.spec.ts`; el tiempo de una persona no se ha medido (`pruebas-usuarios.md` sin completar). | Pruebas con usuarios (T094). Con 2 o 3 personas será **indicativo (n = …)**. |
| SC-002 | 100 % de hallazgos con al menos una cita abrible | **Verificado (auto)** | `p1-journey.spec.ts` («8 de 8 hallazgos con evidencia citada» y cada hallazgo con una cita abrible); datos en `tests/unit/templates.test.ts`. | — |
| SC-003 | 0 archivos salen del navegador | **Verificado (auto)** | `tests/e2e/evidence.spec.ts` («sin solicitudes de red con los archivos ni a otros orígenes») y la vigilancia de red de `p1-journey.spec.ts`. No sustituye una inspección manual con las herramientas del navegador. | Inspección manual opcional (escenario 6 de `quickstart.md`). |
| SC-004 | 100 % de pantallas con contenido simulado muestran «Simulada»; 100 % muestran el aviso de demo | **Verificado (auto)** para las pantallas existentes | `tests/e2e/labels.spec.ts` (recorre las rutas existentes). Informes y encuesta: **No aplica todavía** (no construidos); si se construyen, repetir la prueba. | Repetir `labels.spec.ts` si se construye L5a o L5b. |
| SC-005 | ≥ 9 de cada 10 participantes identifican lo simulado | **NO VERIFICADO** | Ninguna. | Pruebas con usuarios (T094); con 2 o 3 personas solo puede registrarse como **indicativo (n = …)**. |
| SC-006 | Inicio de cada rol en ≤ 3 interacciones; cambio de rol en ≤ 2 | **Verificado (auto)** (parcial) | `tests/e2e/shell.spec.ts` («se llega en 1 interacción» al inicio de cada rol y «cambiar de rol toma 1 interacción»). Es un conteo técnico, no una prueba de usabilidad. | Confirmar en las pruebas con usuarios. |
| SC-007 | 100 % de los elementos interactivos de ≥ 44 × 44 px | **Verificado (auto)** en las pantallas existentes | `tests/e2e/matrix.spec.ts` (todas las pantallas a 320, 768 y 1280 px) y comprobaciones en cada prueba de pantalla. | Estados que la matriz no recorre (p. ej. diálogos abiertos, edición en curso) se cubren solo en pruebas puntuales. |
| SC-008 | Sin desplazamiento horizontal entre 320 y 1920 px; tareas P1 y P2 en celular, tableta y computador | **Verificado (auto)** a 320, 768 y 1280 px; **NO VERIFICADO** a 1920 px | `matrix.spec.ts`; `p1-journey.spec.ts` y `strategy-leader.spec.ts` corren a los tres anchos. | Probar anchos intermedios y 1920 px a mano. |
| SC-009 | P1 y P2 solo con teclado; revisión automática y manual sin incumplimientos AA | **Axe: verificado (auto); manual: NO VERIFICADO** | Axe (`wcag2a`, `wcag2aa`, `wcag22aa`) sin violaciones en todas las pantallas existentes: `matrix.spec.ts` y la salida guardada en `docs/evidencia/axe/`. Varias pruebas usan solo teclado (carga de archivos, navegación, rúbrica con flechas). `revision-manual.md` sin completar. | Revisión manual con teclado y lector de pantalla (T093). Axe no automatiza todo WCAG 2.2 AA. |
| SC-010 | 0 nombres, marcas, logos o datos reales; 0 archivos de `referencias/` | **Verificado (auto)**; revisión humana pendiente | `npm run check` (lista local de nombres vetados, `referencias/` no versionada, ningún PDF en `dist/`, colores en tokens). Con la lista local ausente (CI) esa comprobación se omite. | Revisión humana final (T097) y `git ls-files referencias` vacío (T098). |
| SC-011 | El Líder califica los 4 criterios en ≤ 5 min y el Consultor ve el resultado | **Verificado (auto)** lo funcional; **NO VERIFICADO** el tiempo | `tests/e2e/strategy-leader.spec.ts` (el recorrido de calificación y que el Consultor ve el resultado). El tiempo humano no se ha medido. | Medirlo en las pruebas con usuarios. |
| SC-012 | Ninguna estrategia cita un hallazgo rechazado o NO VERIFICADO; ningún elemento sin respaldo | **Verificado (auto)** | `tests/unit/strategy.test.ts`, `tests/e2e/strategy-leader.spec.ts` y la prueba de sensibilidad (ver `docs/decisiones.md`). | — |
| SC-013 | El promedio mostrado coincide con el de los niveles y no cambia «Emitido» | **Verificado (auto)** | `tests/unit/rubric.test.ts`, `tests/unit/reducer.grading.test.ts`, `strategy-leader.spec.ts` y la prueba de sensibilidad. | — |
| SC-014 | Informe impreso con rótulos legibles en blanco y negro | **No aplica todavía** | El informe imprimible (L5a) no está construido; pendiente de decisión al cerrar L6. | Decisión sobre L5a (T100). |
| SC-015 | Informe imprimible en ≤ 2 interacciones | **No aplica todavía** | Ídem. | Ídem. |

## Tamaño del paquete (meta del plan: menos de 150 kB comprimidos, **NO VERIFICADO**)

Medido con `npm run build` (compresión gzip que informa Vite):

| Recurso | Sin comprimir | Comprimido (gzip) |
|---|---|---|
| JavaScript (`index-*.js`) | 293,7 kB | 89,8 kB |
| CSS (`index-*.css`) | 20,3 kB | ≈ 6,0 kB |
| Tipografía, subconjunto latino (`.woff2`, ya comprimido) | 27,3 kB | 27,3 kB |
| Tipografía, otros dos subconjuntos (latino extendido y vietnamita; el navegador solo los descarga si hacen falta) | 30,1 kB | 30,1 kB |

Con JavaScript, CSS y el subconjunto latino: **≈ 123 kB** (dentro de la meta). Si el navegador descargara también los otros dos subconjuntos de la fuente, serían ≈ 153 kB, algo por encima. La meta sigue **NO VERIFICADO**: no se midió la transferencia real desde Pages.
