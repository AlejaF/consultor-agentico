# Lote H3 · Contrato de composición y lista de piezas (AG-035)

Línea base de H2, medida antes de cambiar nada (`h3-base-h2.json`, Revisión con 4 hallazgos): altura total a 1280 = **2888 px**; bloque de madurez = **762 px**; **1** tarjeta por fila (1280 y 1536); contenido de 976 px sobre 1008 disponibles a 1280, pero tope de 1152 px a 1920 (**68 %** de lo disponible).
Meta: altura ≤ 1877 px (−35 %); madurez ≤ 520 px.

## (a) Contrato de composición (pantalla × punto de corte)

Contenedor: `.main` centrado, ancho máximo 1440 px (1680 px desde 1920), huecos de 16 a 24 px. Barra lateral de navegación (17 rem) desde 1024 px, como en H2.

| Pantalla | 320 | 768 | 1024 | 1280 | 1536 | 1920 |
|---|---|---|---|---|---|---|
| Diagnóstico / Revisión / Informe | 1 columna: lateral arriba, luego hallazgos | 1 columna de hallazgos en 2 (≥640); lateral ARRIBA como banda (tarjeta de nivel + barras en 2 columnas) | principal + lateral sticky 340 px; hallazgos 1 col | principal + lateral 340 px; hallazgos **2 col** | principal + lateral 340 px; hallazgos **3 col** | igual que 1536 en un contenedor de 1680 |
| Lateral (nivel, barras compactas, cifras, avance; en Revisión «Aprobar y emitir») | arriba, apilado | arriba, en banda | derecha, fijo/sticky | derecha, sticky | derecha, sticky | derecha, sticky |
| Estrategia (riesgos) | 1 col | 2 col | 2 col | 2 col | **3 col** | 3 col |
| Estrategia (ruta) | línea de tiempo 1 col | 1 col | **columnas por horizonte (≥2)** | por horizonte | por horizonte | por horizonte |
| Proyectos | 1 col | auto-fill (2) | auto-fill (3) | 3 | 4 (≥1440) | 4 |
| Tablero | cifras 2×2; tabla en tarjetas; cola debajo | cifras 4; tabla; cola debajo | cifras 4; tabla 2/3 + cola 1/3 | igual | igual | igual |
| Gráficos de cabecera (cobertura, estado, traza) | 1 col, scroll interno del mapa | 1 col | zona principal, ancho completo | ídem | ídem | ídem |

Reglas: sin desplazamiento horizontal de página en ningún corte; un solo desplegable de justificaciones en el bloque de madurez (abierto al imprimir); el marcado de la 001 solo recibe envoltorios aditivos.

Decisión de diseño sobre «cuadrícula continua»: los encabezados «Pilar: …» (001) no se mueven ni se ocultan; cada `<section>` de pilar es una celda de la cuadrícula del grupo y las tarjetas de un pilar se apilan dentro de su celda. Así dos pilares con una tarjeta cada uno quedan lado a lado.

## (b) Funciones puras (`src/domain/charts.ts`) y componentes

Funciones (todas reciben estado ya existente y devuelven datos; no escriben nada):
1. `evidenceCoverage(findings, decisions)` → matriz pilar × documento, totales por fila y columna; solo cuenta hallazgos vigentes (aceptado/editado y verificado).
2. `reviewSegments(counts)` → segmentos (aceptados, editados, rechazados, pendientes, NO VERIFICADO) con cifra y porcentaje.
3. `provenanceMatrix(items, findings, decisions)` → elemento × hallazgo según «Deriva de» + hallazgos aceptados sin uso.
4. `riskLevelSegments(risks)` → hasta 3 partes (alto, medio, bajo).
5. `stageSegments(projects)` → proyectos por etapa.
6. `maturityByProject(state)` → barras ordenadas; real / simulado (ilustrativo); sin nivel = sin barra.
7. `traceSummary(run)` → llamadas por herramienta, iteraciones vs tope, verificaciones fallidas, tokens.
8. `groupByHorizon(items)` → columnas de la ruta por horizonte.

Componentes (`src/components/charts/`, solo reciben datos): `ChartFrame` (título-pregunta, valor en texto, «Ver como tabla», tooltip), `SegmentedBar`, `RankedBars`, `Heatmap`, `DotMatrix`, `Meter`. P4 (fragmentos por archivo, radar) solo si hay tiempo.
