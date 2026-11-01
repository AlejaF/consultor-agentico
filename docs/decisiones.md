# Registro de decisiones

## Estado de la sesión

- **Lote cerrado**: L3 (Diagnóstico y revisión), código y verificaciones del agente. **Cierra todo P1** en código. Pendientes de la persona: T022 (convocar participantes), T034 y T035 si L2 aún no se cerró, T049 y T050 (L3).
- **L1**: 15:34 a 15:48 (UTC-5), unos 12 min de agente. **L2**: 16:06:58 a 16:18, unos 11 min.
- **L3 (agente)**: inicio 16:48:07, fin 17:04:02 (UTC-5). Tiempo total de reloj, con pausas: 15 min 55 s. Incluye los ajustes previos A a D (spec, navegación, datos y textos). Plan: 1,9 h (NO VERIFICADO).
- **Punto de control**: acumulado de agente L1 + L2 + L3 ≈ 0,65 h (más las revisiones humanas). El límite de cierre de L3 (≤ 7,0 h) se cumple con holgura.
- **Qué sigue**: revisión humana de L3 (T049), commit y push (T050) y, después, L4 (Estrategia y Líder, P2).

## Decisiones de L1

- `passWithNoTests: true` se puso de forma provisional en `vite.config.ts` para el primer despliegue (T003), cuando aún no había pruebas. **Ya se retiró** (T017): ahora hay 86 pruebas unitarias.
- Enrutador propio con `useSyncExternalStore`; `navigate()` avisa de inmediato para que el cambio de rol y el cambio de ruta se rendericen juntos (evita un aviso espurio de «vista de otro rol» al usar el selector).
- `accessDecision(hash, role, ctx)` recibe un contexto con `consultorProjectIds` y `deliveryExists`. Es una forma concreta del `accessDecision(route, role)` del modelo de datos.
- `scripts/lib/tokens.mjs` contiene la lógica pura de `check-tokens`. El plan solo nombraba `check-tokens.mjs`; se separó para poder probarla sin ejecutar el script.
- `check-names` no imprime el término coincidente, solo archivo y línea, para no copiar un nombre real al registro de la terminal o de CI.
- Estados iniciales sembrados (P-B emitido, P-C enviado y calificado, equipos del Líder) y catálogos de hallazgos y criterios quedan **vacíos en L1** y se completan en L3 y L4, como indica T010. Al añadirlos se revisa `SCHEMA_VERSION`.
- Tras «Restablecer demo» el estado inicial se vuelve a guardar por el flujo normal (equivale al estado borrado).
- Tipografía: Plus Jakarta Sans propia (OFL-1.1). **NO VERIFICADO** que coincida con las referencias.
- Playwright usa el Chromium ya instalado (revisión 1248) y `vite preview`; las capturas de evidencia se generan con `EVIDENCIA=1 npx playwright test capturas` y se guardan en `docs/evidencia/capturas/<lote>/`.

## Verificación de L1 (2026-11-01)

| Verificación | Resultado |
|---|---|
| `npm run typecheck` | sin errores |
| `npm test` | 5 archivos, 86 pruebas en verde (las 5 suites se vieron fallar antes de implementar) |
| `npm run build` | correcto; JS de 74,1 kB comprimidos (meta < 150 kB, NO VERIFICADO) |
| `BASE_PATH=/mi-repo/ npm run build` + `vite preview` | HTML, JS, CSS, fuentes, favicon y emblema con 200 bajo `/mi-repo/` |
| `npm run check` con lista | OK |
| `check-names` sin lista | local: falla con instrucciones (salida 1); con `CI`: avisa y omite solo esa comprobación |
| `npm run test:e2e` | 42 pruebas en verde (14 por ancho: 320, 768 y 1280); axe sin violaciones |

## Decisiones de L2

- **Avance de captura**: cada pregunta respondida es un paso y tener al menos un elemento de evidencia es un paso más (`captureProgress`). El spec no define la fórmula; es una decisión de implementación.
- **Avance del proyecto**: tres fases de un tercio cada una (evidencia ≥ 1, diagnóstico emitido, estrategia enviada). La etapa actual es la primera fase sin completar. Estado: «Pendiente» sin nada hecho, «En curso» con avance, «Completado» con las tres fases.
- **Evidencia que cuenta para «Generar diagnóstico»**: cuenta todo elemento listado, también el que está «Procesando» (FR-015 habla de «al menos un elemento de evidencia»).
- **Clasificación de archivos propios**: `txt`, `vtt` y `srt` van a «Entrevistas y transcripciones»; `pdf` y `docx`, a «Documentos».
- **Orden de las validaciones de archivo**: formato, vacío, tamaño, nombre largo, nombre repetido. El nombre repetido no distingue mayúsculas y también se detecta dentro de la misma selección.
- **Nota «Contenido no conservado en esta demo»**: aparece solo en archivos que vienen del almacenamiento (tras recargar). Los agregados en la carga actual no la llevan, aunque su contenido tampoco se guarda. El registro de agregados vive en memoria (`src/state/session.ts`).
- **«Generar diagnóstico» bloqueado**: usa `aria-disabled` y no `disabled`, para que el teclado y el lector de pantalla lleguen al botón y oigan el motivo. El «enlace» hacia la carga es un botón que lleva el foco a «Elegir archivos» (los enlaces con hash cambiarían de ruta).
- **Desviación menor de T032**: los archivos de prueba (pdf, exe y vacío) se generan en memoria en `tests/e2e/fixtures/archivos.ts`, para no versionar un ejecutable aunque sea ficticio.
- **Prueba de teclado estable**: se vio una carrera (1 de ~12) al abrir el selector de archivos con Enter; se añadió un viaje de ida y vuelta al navegador antes de pulsar. Pasa 30 de 30.
- **Aviso «la nueva evidencia no se refleja…»**: está implementado, pero no tiene prueba e2e porque el estado «emitido» sembrado (P-B) se crea en L3. Pendiente de cubrir ahí.
- **Controles de 44 px**: el enlace «← Proyectos» pasó a ser un botón-enlace (`a.btn`) para cumplir FR-039.
- **Defecto corregido por las capturas**: en 320 px el botón «Quitar» se partía en dos líneas; ahora no se encoge.

## Verificación de L2 (2026-11-01)

| Verificación | Resultado |
|---|---|
| `npm run typecheck` | sin errores |
| `npm test` | 10 archivos, 120 pruebas en verde (las 5 suites nuevas se vieron fallar antes de implementar) |
| `npm run build` | correcto; JS de 78,7 kB comprimidos (meta < 150 kB, NO VERIFICADO); también con `BASE_PATH=/mi-repo/` |
| `npm run check` con lista | OK |
| `npm run test:e2e` | 84 pruebas en verde en 320, 768 y 1280 px (6 omitidas: las de capturas, que solo corren con `EVIDENCIA=1`) |
| Red (SC-003) | 0 solicitudes a otros orígenes y 0 con método distinto de GET o con cuerpo, incluida una carga de 3 archivos y una recarga |
| axe | sin violaciones en Proyectos y en Captura de evidencia (incluido con rechazos visibles) a 3 anchos |

## Decisiones de L3

**Ajustes previos (principio VI: spec → plan → tareas → código)**
- Spec: tres supuestos nuevos (avance de captura, avance del proyecto en tres fases, evidencia «Procesando» cuenta), nombres «Equipo 1» a «Equipo 4», y dos requisitos nuevos: **FR-049** (navegación lateral por rol) y **FR-050** (plurales y tipo de archivo legible). Se numeraron al final porque FR-044 a FR-048 son de P3 y pueden recortarse.
- Plan y contratos: ruta nueva `#/lider/entregas` (destino de «Entregas por revisar (n)»), componente `SideNav`, `schemaVersion: 2`.
- Tareas: T036A (navegación) y T036B (datos y textos) al inicio de L3; los totales pasan a 69 tareas.
- `SCHEMA_VERSION` subió de 1 a 2 porque los estados iniciales sembrados cambiaron (diagnósticos emitidos y decisiones). Quien tenga un estado de L2 guardado verá una vez el aviso de restablecimiento.

**Navegación (FR-049)**
- Pasos del flujo (`flowSteps`): Evidencia completada con al menos un elemento («En curso» si solo hay respuestas); Diagnóstico bloqueado sin evidencia, en curso al generarse, completado al emitirse; Revisión bloqueada sin diagnóstico, en curso con alguna decisión, completada al emitirse; Estrategia bloqueada hasta emitir, completada al enviarse.
- Un paso bloqueado enlaza a su pantalla, que explica el bloqueo; no redirige. La pantalla de Estrategia es provisional: explica el bloqueo y, con el diagnóstico emitido, dice que la generación llega en L4.
- «Entregas por revisar (n)» cuenta las entregas existentes sin calificación. Hasta L4 no hay calificaciones sembradas, así que las cinco entregas sembradas cuentan como por revisar (n = 5).
- En celular el menú tiene los mismos elementos. Escape lo cierra y devuelve el foco a «Menú»; al elegir un enlace se cierra y el foco pasa al `h1`.
- La barra lateral a 1280 px se extiende hasta el final de la página (no es fija: acompaña el alto del contenido).

**Diagnóstico y revisión**
- Plantilla única de 8 hallazgos (2 de Estrategia, 1 de Infraestructura, 2 de Datos, 1 de Gobernanza, 1 de Talento y 1 de Cultura); el único NO VERIFICADO es H5. Índice de madurez 2,4 de 5 (ilustrativo, ficticio).
- El panel de evidencia va dentro de la tarjeta del hallazgo: al lado en escritorio y debajo en celular. Cada cita se abre con teclado y toda cita lleva «Evidencia de ejemplo (ficticia)».
- «Aprobar y emitir» usa `aria-disabled` (como «Generar diagnóstico»): se puede enfocar y pulsar, pero no hace nada y explica el motivo. Por eso las pruebas lo pulsan con `force`.
- El estado «edición sin guardar» cuenta cuando el editor está abierto y el texto cambió; al cambiar de rol se pide confirmación («Seguir editando» / «Cambiar de rol»).
- Semillas: P-B emitido con H5 aceptado NO VERIFICADO, H2 editado y H4 rechazado; P-C y los equipos 2 a 4 con el diagnóstico emitido (el equipo 2 con un rechazo). La estrategia enviada y las calificaciones sembradas llegan en L4 (T055).
- Se corrigió durante el lote un plural sin concordar («1 editados») que detectó una prueba e2e.

**Pruebas**
- `tests/e2e/capturas.l3.spec.ts` genera las capturas con `EVIDENCIA=1`. Las de L1 y L2 se regeneraron por el cambio de nombres de equipos.

## Verificación de L3 (2026-11-01)

| Verificación | Resultado |
|---|---|
| `npm run typecheck` | sin errores |
| `npm test` | 16 archivos, 172 pruebas en verde (las 8 suites nuevas se vieron fallar antes de implementar) |
| `npm run build` | correcto; JS de 84,4 kB comprimidos (meta < 150 kB, NO VERIFICADO); también con `BASE_PATH=/mi-repo/` |
| `npm run check` con lista | OK |
| `npm run test:e2e` | 150 pruebas en verde en 320, 768 y 1280 px (12 omitidas: capturas y dos pruebas que solo aplican a un ancho) |
| Recorrido P1 | completo, con recarga inmediata tras emitir; 0 solicitudes a otros orígenes y 0 con método distinto de GET o con cuerpo |
| axe | sin violaciones en ingreso, proyectos, captura, diagnóstico, revisión (con edición y panel abiertos) y revisión emitida, a 3 anchos |

## Cambio posterior a L3: formato XLSX

- **Spec primero (principio VI)**: el supuesto «Formatos» y FR-010 pasan a PDF, DOCX, TXT, VTT, SRT y XLSX, y el spec dice que los formatos salen de las **dos** referencias (la de estudiantes muestra una hoja de cálculo como evidencia). «Fuera de la demo» aclara que las hojas de cálculo solo se listan, sin leer su contenido. Después se actualizaron `data-model.md` (regla de validación), T023 y T085 (README).
- Un XLSX se trata como **documento** y se rotula «Cargado localmente · no analizado». El audio (por ejemplo `.mp3`) y el formato antiguo `.xls` siguen rechazados con el motivo y la lista de formatos permitidos.
- Código: `ALLOWED_EXTENSIONS`, `ALLOWED_LABEL` y el atributo `accept` del selector de archivos. El texto «Formatos permitidos» de la pantalla de captura sale de la misma constante.
- Pruebas: unitarias de `validateFiles` (XLSX aceptado, `.mp3` y `.xls` rechazados) y de `kindOfFile`; e2e nueva con un XLSX en «Documentos» y un `.mp3` rechazado.
- **README**: todavía no existe (se escribe en L6, T085). El requisito de nombrar los formatos permitidos (con el audio fuera) quedó en la descripción de T085.

## Lista de pulido (para L6)

Observaciones de las revisiones humanas de L1 y L2. Se atienden en la pasada de pulido de L6 (T095) salvo lo ya resuelto. Cualquier cambio de comportamiento se corrige primero en el spec.

1. ~~Separar «Restablecer demo» de la navegación lateral.~~ **Resuelto en L3** (T036A): va al pie, separado por una línea.
2. ~~Dar estilo al texto «Estás como…».~~ **Resuelto en L3** (T036A): se reemplazó por una tarjeta de cuenta («Nombre · cuenta ficticia»).
3. El ingreso a 1280 px es sobrio y podría acercarse más al estilo de las referencias.
4. ~~La barra lateral queda casi vacía en el inicio del Consultor.~~ **Resuelto en parte en L3**: ahora lleva los pasos del proyecto y el pie; revisar el aspecto en la pasada de pulido.
5. Subir «Generar diagnóstico» y el progreso de captura en pantallas pequeñas (hoy quedan al final de la página de captura).
6. Altura despareja de las tarjetas de proyecto (la lista de Proyectos).
