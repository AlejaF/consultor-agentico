# Registro de decisiones

## Estado de la sesión

- **Lote cerrado**: L6 (cierre) en lo que no es de la persona (T081 a T092), más las correcciones A a C. L4 ya está en el commit `7c9c329`. **Pendientes de la persona**: T093 (la revisión de teclado se hizo el 2026-11-02; falta la del lector de pantalla), T095 (pulido), T096 (volcar resultados de T095), T097 a T099 (revisión final, commit y publicación).
- **Tiempos del agente**: L1 15:34 a 15:48; L2 16:06:58 a 16:18; L3 16:48:07 a 17:04:02; ajustes F a I y L4 18:49:51 a 19:06:55; siete ajustes previos al commit de L4 (sin hora de inicio registrada); correcciones A a C y L6 19:52:15 a 20:17:38 (25 min con pausas). Acumulado de agente ≈ 1,3 h (más revisiones humanas); los puntos de control de L1, L3 y L4 se cumplen con holgura.
- **Verificación al cierre de L6**: `typecheck` sin errores; `npm test` 231 en verde; `npm run build` y `BASE_PATH=/mi-repo/ npm run build` correctos; `npm run check` OK; `EVIDENCIA=1 npx playwright test` 325 pasadas y 8 omitidas.
- **Después de L6: L6f (2026-11-02)**: encabezado adaptable, informe imprimible L5a, recuento NO VERIFICADO y cobertura (ver «Lote L6f»). **Pendientes de la persona además**: T071 (imprimir una vez el informe) y T072 (commit); L5b sigue sin decidir.
- **Qué sigue**: la persona completa T093, T095 y T096 a T099. La decisión sobre P3 (T100) quedó tomada el 2026-11-02: se incluyen L5a y L5b (ver «Lote L6g»).

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
- «Entregas por revisar (n)» cuenta las entregas existentes sin calificación. Hasta L4 no hay calificaciones sembradas, así que las cinco entregas sembradas cuentan como por revisar (5).
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

## Ajustes F a I (antes de L4)

Inicio: 2026-11-01 18:49:51. Orden aplicado en cada uno: spec → plan y tareas (T050A a T050D) → pruebas que fallan → código.

- **F (T050A)**: los grupos de hallazgos se rotulan «Pilar: <nombre>» (Diagnóstico y Revisión; informe y Estrategia al construirse). Junto a un hallazgo NO VERIFICADO aceptado o editado se muestra «No se usará como respaldo de la estrategia». La línea «N hallazgos aceptados no se usaron como respaldo porque están NO VERIFICADO» (solo con N > 0) va en la pantalla de Estrategia (L4).
- **G (T050B)**: bajo 1024 px la navegación del rol es una barra de pestañas siempre visible bajo la cabecera; el botón «Menú» pasó a «Cuenta» y solo contiene la tarjeta de cuenta y «Restablecer demo». Un elemento de navegación aparece solo si su pantalla existe (`src/app/features.ts`: «Encuesta» queda oculta hasta que exista la encuesta del Contacto; si esa parte se corta, no aparece). En la lista de proyectos del Consultor no hay barra bajo 1024 px. Bajo 480 px las cuatro pestañas de un proyecto se acomodan en dos líneas de dos para no desbordar a 320 px.
- **I (T050D)**: el Líder no aprueba ni bloquea; solo califica después. Nuevos textos en la ventana de emisión y en el banner «Emitido», botón «Continuar con la Estrategia →» y estado «Disponible» del paso Estrategia con el diagnóstico emitido.
- **H (T050C)**: pasada de redacción. Cambios de texto (antes → después):

| Dónde | Antes | Después |
|---|---|---|
| Hallazgo H4 (`src/data/diagnosis.ts`) | «…y se concilian una vez por semana…» | «…y se consolidan una vez por semana…» |
| Extracto S1-E1 (`src/data/evidence.ts`) | «…y se reconcilian una vez por semana entre las áreas.» | «…y se consolidan una vez por semana entre las áreas.» |
| Título de H2 | «Costo de atender a un cliente nuevo desconocido» | «Se desconoce el costo de atender a un cliente nuevo» |
| Hallazgo H8 | «…las herramientas de analítica probadas se abandonaron a los pocos meses.» | «…las herramientas de analítica que han probado se abandonaron a los pocos meses.» |
| Ingreso | «el control por rol es solo de experiencia; no protege datos.» | «el control por rol solo sirve para probar cada perfil; no protege datos.» |
| Revisión sin diagnóstico | «Ir a Generar diagnóstico» | «Ir a generar el diagnóstico» |
| Ventana «¿Aprobar y emitir…?» | «…Se creará la entrega para el Líder.» | «El Líder podrá revisarlo y calificarlo después; no necesitas su aprobación para continuar con la estrategia.» |
| Banner «Emitido» | «Se creó la entrega visible para el Líder.» | «En la cola del Líder. Su calificación aparecerá aquí cuando la guarde. No bloquea tu trabajo: puedes continuar con la estrategia.» (cambio de L6g, pieza H; antes decía que el Líder «podrá calificarlo cuando quiera») |
| Estrategia (texto provisional) | «…todavía no está construida en esta versión de trabajo; llega en el siguiente lote.» | «La estrategia se podrá generar a partir de los hallazgos aceptados o editados y verificados de este diagnóstico.» |
| Subtítulo de cada hallazgo | «Estrategia» / «Datos»… (sin prefijo) | Encabezado de grupo «Pilar: Estrategia», «Pilar: Datos»… |

Sin cambios de significado, cifras ni rótulos exigidos por el spec («Simulada», «NO VERIFICADO», «Evidencia de ejemplo (ficticia)»).

## Decisiones de L4

- Inicio de L4: 2026-11-01 18:56:08 (tras cerrar los ajustes F a I, e2e en verde: 196 pasadas, 14 omitidas).
- Fin de L4: 2026-11-01 19:06:55. Ajustes F a I: 18:49:51 a 18:56:08 (6 min); L4: 18:56:08 a 19:06:55 (11 min). Total con pausas: 17 min.
- Estrategia: se calcula (`deriveStrategy`), no se guarda; cuatro riesgos y cuatro fases con `supportedBy`; un elemento sin respaldo verificado no se muestra. «Deriva de» incluye el pilar de cada hallazgo.
- Calificación: `saveGrading` es idempotente y no toca diagnóstico ni estrategia; no existe devolución. Se siembran `dx/P-C`, `st/P-C` y `dx/E-1` (Equipo 2) calificadas; `dx/E-2`, `dx/E-3` y `dx/P-B` quedan por revisar.
- Tablero: «Equipos activos» cuenta equipos con algún avance; «Promedio de calificaciones» es la media de los promedios guardados. La etapa del equipo es la más avanzada de sus proyectos.

## Verificación de L4 (2026-11-01)

| Verificación | Resultado |
|---|---|
| `npm run typecheck` | sin errores |
| `npm test` | 201 pruebas unitarias en verde |
| `npm run build` | correcto |
| `npm run check` | OK |
| `npm run test:e2e` | 235 pasadas y 20 omitidas (capturas y pruebas solo de pantalla ancha) |


## Prueba de sensibilidad de L4 (2026-11-01)

En L4 las pruebas unitarias nuevas se escribieron antes del código, pero no se ejecutó la corrida roja. Para compensarlo, cada regla central se rompió temporalmente en producción, se ejecutó `npm test` y se restauró el código (comprobado byte a byte).

| Ruptura | Resultado |
|---|---|
| 1a. `deriveStrategy` usa hallazgos NO VERIFICADO como respaldo | Falla (3 pruebas: `strategy`, `ajustes`) |
| 1b. `deriveStrategy` usa hallazgos rechazados | Falla (5 pruebas: `strategy`, `ajustes`) |
| 2a. Media incorrecta (divide entre 5) | Falla (3 pruebas: `rubric`, `reducer.grading`) |
| 2b. Puntaje sin formato de un decimal | Falla (1 prueba: `rubric`) |
| 2c. Puntaje con punto en vez de coma | Falla (2 pruebas: `format`, `rubric`) |
| 3a. Guardar una calificación cambia el diagnóstico | Falla (2 pruebas: `reducer.grading`) |
| 3b. Guardar una calificación cambia la estrategia | Falla (1 prueba: `reducer.grading`) |
| 4a. `sendStrategy` permite enviar sin estrategia generada | Falla (1 prueba: `reducer.grading`) |
| 4b. `sendStrategy` no es idempotente | Falla (1 prueba: `reducer.grading`) |
| 4c. Entrega `st` duplicada | Falla (1 prueba: `deliveries`) |
| 5a. `accessDecision` deja pasar toda ruta de otro rol | Falla (29 pruebas) |
| 5b. `accessDecision` deja pasar las rutas de otro rol solo al Líder | **No fallaba ninguna prueba** |

La ruptura 5b reveló una prueba que faltaba: solo se comprobaban algunas combinaciones de rol. Se añadió `tests/unit/access.roles.test.ts`, que prueba todas las rutas de cada rol contra los otros dos (aviso y destino exactos) y que cada rol abre las suyas. Con ella 5a y 5b fallan (29 y 8 pruebas). Con el código restaurado: 228 pruebas unitarias en verde.

## Siete ajustes previos al commit de L4 (T064A)

Orden aplicado: spec (FR-023, FR-049, historia 7) → tasks.md → pruebas (5 fallos unitarios antes de implementar) → código.

1. **Puntaje de la rúbrica en una línea**: `white-space: nowrap` en «N de 5» de la vista de solo lectura. Prueba e2e (`tests/e2e/ajustes7.spec.ts`) que mide que cada puntaje ocupa una sola línea, en Consultor y Líder, a 320, 768 y 1280 px.
2. **Destino del bloqueo de Estrategia**: sin diagnóstico generado, «Ir al diagnóstico»; generado y sin emitir, «Ir a la revisión» (`blockedStrategyLink`). Pruebas unitaria y e2e de ambos casos en P-A.
3. **Promedio del tablero**: la lógica pasó a `averageOfGradings` (incluye ejemplo y sesión). Pruebas unitaria (de 4,2 a 3,4 al añadir una calificación de 1,0) y e2e (el tablero pasa de «4,2 de 5» a «3,4 de 5», con coma).
4. **Una sola insignia «Simulada»** en la vista del Líder: en entregas de estrategia la pone la propia estrategia; en las de diagnóstico, su encabezado. Prueba e2e de que hay una sola.
5. **Captura del aviso «No encontramos esa pantalla.»**: escenario = el Líder abre `#/lider/entregas/xx/P-B` (tipo de entrega desconocido) y vuelve al tablero con el aviso. Carpeta `docs/evidencia/capturas/L4/`, archivos `tablero-aviso-ruta-desconocida-{320,768,1280}.png` (antes `redireccion-con-aviso-*`, ya borrados).
6. **«Opciones»** reemplaza a «Cuenta» (cabecera bajo 1024 px). La tarjeta dice «Sesión de demostración · [nombre] (cuenta ficticia)» y conserva «Restablecer demo».
7. **«Contacto de la empresa»** en el selector, el ingreso, los avisos y el spec. Hoy ese rol no tiene vista propia: antes mostraba un resumen provisional con la empresa ficticia; ahora muestra «Esta vista es para la persona de la empresa cliente que recibe el informe. Aún no está disponible en esta demostración.», sin barra de navegación ni enlaces (`FEATURES.contactSummary = false`; «Resumen» y «Encuesta» aparecerán solo cuando existan). El nombre de la cuenta ficticia sigue siendo «Contacto Demo».

Verificación: `typecheck` sin errores; `npm test` 231 en verde; `check` OK; `test:e2e` 260 pasadas, 21 omitidas y 1 fallo intermitente (`shell.spec.ts`: «el primer elemento enfocable es Saltar al contenido», solo a 320 px, en la pantalla de ingreso, que este cambio no toca); repetida 24 veces pasó 24 de 24. Capturas regeneradas completas en `ajustes/` y `L4/` (todas muestran la cabecera o la barra lateral con los textos nuevos); las de L1 a L3 siguen con los textos anteriores.

## Correcciones A a C y cierre de L6 (2026-11-01)

Inicio: 19:52:15. Fin: ver «Estado de la sesión».

**Correcciones de L4 (T064B a T064D)**: spec y tareas primero, luego pruebas que fallan, luego código.
- **A. Niveles de la rúbrica a 320 px**: ahora los 5 botones comparten una fila (44 px cada uno, separación de 4 px). Prueba en `tests/e2e/correcciones-l6.spec.ts`; falló a 320 px antes del cambio.
- **B. Cabecera a 320 px**: marca y «Opciones» en la primera fila; «Rol activo» y el selector en la segunda (antes, tres filas). Se verificó que la prueba falla sin el cambio de estilo. La primera versión de la prueba contaba mal las filas (comparaba el borde superior de elementos centrados); se corrigió para agrupar por solapamiento vertical.
- **C. Prueba intermitente «el primer elemento enfocable es Saltar al contenido» (320 px)**: se repitió 50 veces en aislado (50 de 50 pasan) y 80 veces con 12 trabajadores en paralelo (1 fallo). Causa más probable: la prueba pulsaba Tab justo después del evento `load`, antes de que React terminara de pintar el ingreso, de modo que el enlace aún no existía. Dos sondas (comprobar el estado de la página y el elemento enfocado antes y después de Tab) no reprodujeron el fallo en 200 y 150 repeticiones, lo que concuerda con una carrera de tiempos de la prueba y no con un defecto de enfoque de la aplicación; no hay código que robe el foco al cargar. **No se pudo observar directamente la causa**: queda como la explicación más probable. Corrección: la prueba espera la condición (el enlace existe) antes de pulsar Tab, sin pausas arbitrarias. Después, 120 repeticiones con la misma carga: 120 de 120 pasan.

**L6 (T081 a T092)**
- Matriz transversal (`matrix.spec.ts`), rótulos (`labels.spec.ts`) y subruta (`base-path.spec.ts`) leen las rutas existentes de `src/app/router.ts` menos `UNBUILT_ROUTES` (`src/app/features.ts`). Una prueba comprueba que las direcciones de muestra cubren exactamente las rutas existentes, para que una pantalla nueva no quede sin probar. Se comprobó que la matriz falla si un enlace de navegación baja de 44 px y que la prueba de subruta falla si se compila sin `BASE_PATH`.
- Con `EVIDENCIA=1`, `npx playwright test` regenera **todas** las capturas (L1 a L4, ajustes y matriz por ancho, incluida la vista del Contacto de la empresa a 320, 768 y 1280 px) y las salidas de axe (`docs/evidencia/axe/`). Se borraron antes las capturas anteriores para que no queden textos obsoletos.
- README honesto, `docs/evidencia/` (README, revisión manual, checklist de SC, correspondencia de `quickstart.md`) y la licencia OFL en `public/licenses/OFL-PlusJakartaSans.txt` (se verificó que `dist/licenses/` la incluye).
- **Conciliación (T090)**: se corrigieron `plan.md` y `contracts/routes.md` (pestañas en vez de menú, «Opciones», «Disponible», el Contacto de la empresa sin navegación mientras no exista su vista) y la «Línea de corte» de L5b en `tasks.md` (la ruta `#/contacto` se conserva con su mensaje). El spec ya estaba al día por los ajustes anteriores. Los escenarios de `quickstart.md` **no se ejecutaron a mano**: `docs/evidencia/quickstart-resultados.md` dice qué prueba automática cubre cada uno.
- **SC-001 y SC-005 figuran «No evaluado en esta versión de demostración»**: sin resultados y sin ninguno inventado.
- Tamaño del paquete: JS 89,8 kB + CSS ≈ 6,0 kB + tipografía latina 27,3 kB ≈ 123 kB comprimidos, bajo la meta de 150 kB (NO VERIFICADO: no se midió la transferencia real).

## Registro corto de decisiones técnicas (T086)

- **Enrutador propio** (`useSyncExternalStore`, rutas con `#`): evita dependencias y no necesita configuración de servidor en Pages; `navigate()` notifica de inmediato.
- **Persistencia**: guardado con retraso de 200 ms más guardado inmediato en `pagehide` y `visibilitychange`, para no perder la última acción al recargar; validación de forma con catálogos inyectados y vuelta al estado inicial si algo no cuadra; solo nombre, tipo y tamaño de los archivos propios.
- **Plantillas únicas de datos**: un diagnóstico y una estrategia compartidos por todos los proyectos; solo cambian las decisiones por proyecto.
- **CI sin Playwright**: el flujo de GitHub Actions ejecuta typecheck, pruebas unitarias, compilación y `check`; las pruebas de extremo a extremo y la evidencia corren en local (el Chromium ya instalado y `vite preview`).
- **Contraste**: la paleta se verificó con pruebas unitarias de contraste (`tests/unit/tokens.test.ts`) y solo se usan tokens; `check-tokens` rechaza colores literales.
- **Tipografía**: Plus Jakarta Sans propia (OFL-1.1), aproximación a la de las referencias: **NO VERIFICADO**.
- **Acciones de Pages**: `checkout@v6`, `setup-node@v6`, `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4` (el conjunto de la documentación oficial; el ejemplo oficial usaba otras etiquetas, ver `research.md`); el primer despliegue quedó en verde (T018 a T021).
- **Desviaciones del plan**: ajustes A a D (L3), pestañas y «Opciones» (G), claridad tras emitir (I), formato XLSX, el rol «Contacto de la empresa» sin vista propia y los siete ajustes previos al commit de L4; todos se corrigieron primero en el spec. Horas por lote: ver «Estado de la sesión».

## Lote L6b: ajustes de interfaz tras L6 (T101 a T105)

Pedidos por la persona que prueba la demo. Orden: spec (FR-001, FR-002, FR-006, FR-030, FR-032, FR-049, nuevo FR-051, historias 1 y 6) → tareas (lote L6b) → pruebas (5 unitarias y 15 e2e fallaron antes de implementar) → código.

1. **Comentario de la rúbrica opcional (T101)**: se guarda con los 4 niveles y sin comentario. Ayuda: «Elige un nivel de 1 a 5 en los 4 criterios. El comentario es opcional.» (con 1 a 3 criterios sin nivel: «Faltan N criterios por calificar. El comentario es opcional.»). Límite de 2000 caracteres. Vista de solo lectura sin comentario: «Sin comentario». Un comentario vacío o de solo espacios se guarda como cadena vacía.
2. **De «Opciones» a «Restablecer demo» (T102)**: se eliminaron el botón «Opciones», el panel de cuenta y la tarjeta «Sesión de demostración · … (cuenta ficticia)» en los tres roles y todos los anchos. Un único botón «Restablecer demo» en la cabecera, siempre visible; ya no está en la barra lateral ni en el ingreso. Una sola confirmación: «¿Restablecer la demo? Se borrarán tus cambios en este navegador.» (reutiliza el diálogo nativo existente: foco atrapado, Escape y «Cancelar»). A menos de 480 px se ve «Restablecer»; el nombre accesible es siempre «Restablecer demo» (contiene la etiqueta visible).
3. **«Inicio» (T103)**: la cabecera lleva «Inicio» y la marca «Consultor Agéntico», ambos hacia el ingreso **sin borrar el estado**. Para eso cambió la regla 2 de `contracts/routes.md`: con un rol activo, `#/` ya no redirige al inicio del rol, sino que muestra el ingreso (que no lleva cabecera ni navegación); al elegir una cuenta se entra a su inicio. Cambiar de rol con el selector va **siempre a la pantalla de inicio del nuevo rol** y conserva el estado (con confirmación si hay una edición sin guardar). A menos de 768 px la cabecera es una cuadrícula de dos filas (marca + «Inicio»; «Rol activo» + «Restablecer»).
4. **Ingreso (T104)**: se quitaron los botones «Entrar como …»; cada cuenta es un único botón (la tarjeta completa), sin controles anidados, con «Entrar →» como texto indicativo, foco y paso del puntero visibles. Nombre accesible: «Entrar como <rol>: <nombre de la cuenta>. <rol> · <subtítulo>».
5. **Puntaje en la tarjeta de proyecto (T105)**: «Calificada · N de 5» no se parte (`white-space: nowrap`), con prueba a 320, 768 y 1280 px.

Otros cambios menores: la prueba pesada «axe … en las pantallas P1» de `p1-journey.spec.ts` pasó a un límite de 90 s (con la suite en paralelo superó los 30 s por defecto en una corrida; sola tarda unos 8 s). La navegación ya no deja una columna lateral vacía cuando el rol no tiene pantallas (Contacto de la empresa).

## Lote L6c: encabezado a 320 px y capturas faltantes (T106 y T107)

Inicio: 2026-11-01 20:53:57. Spec primero (FR-051 y «Pantalla pequeña»), tareas, pruebas que fallaron (3 de 4 pruebas nuevas a 320 px: el selector tenía 29 px de espacio útil y mostraba «Cons») y después el código.

- **Disposición del encabezado a 320 px** (tres filas): fila 1, marca + «Inicio»; fila 2, la etiqueta «Rol activo» + «Restablecer»; fila 3, el selector a todo el ancho. Se priorizó (1) el texto del rol completo, (2) «Inicio» y «Restablecer» con 44 px y (3) la etiqueta «Rol activo» visible. La etiqueta pasó a ser un `label` hermano del `select` (con `htmlFor`) y no su contenedor. Desde 768 px todo va en una sola fila y el selector tiene un ancho mínimo de 15 rem para que «Contacto de la empresa» no se recorte.
- **Prueba** (`tests/e2e/l6c.spec.ts`): en cada rol, a 320, 360 y 768 px, mide el texto del rol seleccionado con la misma fuente del selector y exige que quepa en el espacio interior (reservando 24 px para la flecha), que el selector esté dentro de la pantalla, que la fuente sea ≥ 14 px, que «Inicio» y «Restablecer» midan ≥ 44 px, que «Rol activo» sea visible y que no haya desplazamiento horizontal. **Límite**: es una medición del ancho del texto, no una captura de pantalla del selector abierto; la reserva de 24 px para la flecha es una aproximación, por eso hay margen extra. `labels.spec.ts` comprueba además, en todas las pantallas, el rol seleccionado completo y la etiqueta visible.
- La prueba de L6 que exigía «como máximo 2 filas» (`correcciones-l6.spec.ts`) pasó a «como máximo 3 filas», según lo pedido.
- **Capturas nuevas** (`docs/evidencia/capturas/L6c/`, cada una a 320, 768 y 1280 px): `restablecer-dialogo-<ancho>.png`, `calificacion-sin-comentario-lider-<ancho>.png` y `calificacion-sin-comentario-consultor-<ancho>.png`.

## Lote L6d: defecto de «Restablecer demo» y encabezado (T108 a T110)

Inicio: 2026-11-01 21:16:14. Fin: 21:28:04. Orden: reproducción → causas → spec (FR-006, FR-051, `contracts/persisted-state.md`) → tareas → pruebas que fallan → código.

**1. Reproducción (navegador real de Playwright, build de producción con `vite preview`, con y sin `BASE_PATH=/mi-repo/`)**: como Consultor se generó y envió la estrategia de P-B, se generó el diagnóstico de P-A y se cargó un PDF; como Líder se calificó `st/P-B`; se pulsó «Restablecer demo» y se confirmó; se entró a cada rol sin recargar y luego recargando. **En una sola pestaña no se reprodujo el fallo**, con ni sin `BASE_PATH`: el almacenamiento quedó sin clave justo tras restablecer y con el estado de ejemplo (rol nulo, estrategia de P-B «none», sin `st/P-B`, diagnóstico de P-A «none», sin archivos) a los 600 ms; la interfaz mostró «Generar estrategia», «Generar diagnóstico», sin el PDF, 3 entregas por revisar y promedio 4,2, sin recargar y recargando.

**2. Causas candidatas**
- **Confirmada (d), otra pestaña con datos viejos**: con dos pestañas del mismo navegador, la pestaña A restablece (almacenamiento limpio) pero la pestaña B conserva el estado viejo en memoria. En cuanto B guarda cualquier cambio (por ejemplo, cambiar de rol), escribe **todo su estado viejo** en el almacenamiento: reaparecen la estrategia enviada, la calificación `st/P-B`, etc., y al recargar A los datos «siguen como estaban». Reproducido y medido (antes y después en el almacenamiento).
- **Descartada (a), el estado en memoria no se reinicia**: tras restablecer, la memoria quedó en el estado de ejemplo (la interfaz lo mostró sin recargar).
- **Descartada (b), el guardado con retraso o el vaciado en `pagehide`/`visibilitychange` reescribe lo viejo**: restablecer a menos de 200 ms de un cambio dejó el almacenamiento en «none»; `reset()` cancela el temporizador y el guardado pendiente. (El vaciado en `pagehide` solo escribe lo pendiente, que tras restablecer es el estado de ejemplo.)
- **Descartada (c), la carga mezcla lo guardado con los datos de ejemplo**: `load()` devuelve el estado guardado entero, sin mezclar; tras recargar solo había datos de ejemplo.
- **Descartada (e), otras causas revisadas**: el único estado a nivel de módulo es el conjunto de identificadores de archivos añadidos (no son datos); el estado inicial se clona (`structuredClone`) y los reductores no mutan.
- **No confirmada**: que el defecto informado en la demo publicada ocurriera con una sola pestaña. No pude reproducirlo así. Lo más probable es que haya sido la causa (d) (varias pestañas abiertas), pero **no puedo afirmar** que sea la que vio la persona; tampoco comprobé qué versión estaba desplegada en ese momento.

**3. Corrección**: `persistence.adopt()` (cancela el guardado propio pendiente y lee el almacenamiento sin escribir) y `attachStorageSync`: cuando otra pestaña guarda o restablece, esta adopta el estado y **no** lo reescribe (evita bucles y que los datos viejos resuciten). Con la clave borrada adopta el estado de ejemplo y muestra «Se restableció la demo.». `reset()` ya cancelaba el temporizador y el guardado pendiente; ahora está probado. Límite conocido: dos pestañas que editan a la vez siguen siendo «gana la última que guarda» para el resto de cambios.

**4. Comprobación de que no queda nada de la sesión anterior** (`tests/e2e/restablecer.spec.ts`, `tests/unit/persistence.test.ts`): tras restablecer, sin recargar y recargando, el almacenamiento (sin clave o igual al estado de ejemplo sin rol) y la interfaz muestran las calificaciones, estrategias, diagnóstico y evidencia de ejemplo; entregas por revisar = 3; sin `st/P-B`. Con dos pestañas, la pestaña vieja vuelve al ingreso y no reescribe nada; la prueba falló antes de la corrección.

**5. La marca «Consultor Agéntico» deja de ser un enlace** (logo y texto sin subrayado ni foco); «Inicio» es el único control hacia el ingreso (prueba en `l6b.spec.ts` y `labels.spec.ts`).

**6. Encabezado por tramos de ancho** (FR-051; pruebas en `l6c.spec.ts` y `l6b.spec.ts`): menos de 520 px, tres filas (marca + «Inicio»; «Rol activo» junto a su selector; «Restablecer demo» a la derecha, sin ocupar todo el ancho); de 520 a 767 px, dos filas; desde 768 px, una fila. Orden de Tab: Inicio, selector, Restablecer demo. «Restablecer demo» con el texto completo en todos los anchos. **Desvío de lo pedido, y por qué**: se pidió que las dos filas empezaran en 400 px; medido, con menos de unos 520 px no caben en una sola fila a la vez la etiqueta, el rol «Contacto de la empresa» completo y «Restablecer demo» (el texto necesita ≥ 184 px más la flecha). Se dio prioridad a mostrar el rol completo, como se pidió. Para llegar ahí a 320 px: etiqueta «Rol activo» de 12 px por debajo de 768 px (14 px desde 768) y menos relleno en el selector. Verificado también a ojo en capturas a 320, 520 y 768 px.

**Verificación**: `typecheck` sin errores; `npm test` 236 en verde; `build` y `check` correctos; `EVIDENCIA=1 npx playwright test` 379 pasadas y 23 omitidas (pruebas de un solo ancho y capturas); capturas regeneradas (132) y salidas de axe sin violaciones.

## Investigación adicional del defecto de «Restablecer demo» (2026-11-01, 21:46)

Contexto: la persona lo probó con una pestaña en el celular y otra en el computador (dispositivos distintos, sin almacenamiento compartido), así que la causa de las dos pestañas (L6d) **no lo explica**. No se cambió código de producción: ninguna de las hipótesis siguientes reprodujo el fallo.

**Qué se probó** (`tests/e2e/restablecer-movil.spec.ts`, emulación de un Pixel 7 sobre Chromium, build de producción con `vite preview`; el escenario sucio es el de siempre: estrategia de P-B enviada, calificación `st/P-B`, diagnóstico y PDF en P-A):
1. **Vaciado en `visibilitychange` (hidden) y `pagehide` justo después de restablecer** (sin esperar los 200 ms): el almacenamiento queda con el estado de ejemplo (el vaciado escribe el estado **actual**, no uno capturado antes: `flush` lee la variable `pending` al ejecutarse, no al registrarse). También con el diálogo abierto, ocultando la página y confirmando al volver.
2. **`pageshow` con `persisted`** tras restablecer: sin efecto (la aplicación no tiene manejador de `pageshow`; la memoria es la de ejemplo). **Límite**: Chromium sin interfaz de Playwright no entregó una restauración real desde la caché de avance y retroceso (`persisted` fue falso al volver con «atrás» en un intento con la caché habilitada), así que solo se probó el evento emulado.
3. **Pestaña descartada y reabierta** justo después de restablecer (se cierra la pestaña sin esperar el guardado y se abre otra): el almacenamiento y la interfaz quedan de ejemplo, también tras recargar.
4. **Cambiar de rol con el selector y pulsar «Inicio» de inmediato**, y luego atrás y adelante del historial: el almacenamiento y la interfaz quedan de ejemplo.

**Causa: sigue NO CONFIRMADA.** Lo que no se pudo hacer: probar en un celular real, con Safari/iOS o con la caché de avance y retroceso real, ni conocer los pasos exactos de la persona ni la versión desplegada en ese momento.

**Hipótesis sin confirmar (f), a verificar con la persona**: los datos de ejemplo del estado restablecido se parecen mucho a lo que la persona describió como «datos que siguen». Tras restablecer, la demo trae **por diseño** 3 calificaciones (`dx/P-C`, `st/P-C`, `dx/E-1`), la estrategia de P-C enviada, las decisiones del diagnóstico de P-B (aceptado, editado, rechazado y un hallazgo NO VERIFICADO aceptado) y evidencia de ejemplo en todos los proyectos. Si la persona esperaba una demo «en blanco», ese contenido puede parecer que no se restableció. Esta hipótesis **no está probada**; la prueba que la distingue es que lo que la persona cambió (p. ej., una calificación nueva, una estrategia generada en P-B) desaparezca mientras lo sembrado permanezca, y eso es lo que comprueban `restablecer.spec.ts` y `restablecer-movil.spec.ts`. Se propone preguntarle qué dato concreto vio, y decidir (primero en el spec) si conviene rotular el contenido sembrado («Dato de ejemplo») o ofrecer un estado en blanco.

## Lote L6e: rol «Empresa», encabezado en dos filas, textos de restablecer y cobertura (T111 a T115)

Inicio: 2026-11-01 22:15:51. Fin: 22:25:41. Spec primero (FR-001, FR-006, FR-051, nuevo FR-052), tareas, pruebas que fallaron (2 unitarias y varias e2e) y después el código.

- **3a. «Restablecer demo» funciona**: la persona verificó que funciona correctamente. Con eso, la hipótesis (f) de la investigación anterior (el contenido de ejemplo precargado se confundía con datos que «no se restablecían») pasa de **sin confirmar** a **compatible con lo informado**; sigue sin ser una confirmación de causa del defecto original. Por eso se añadieron los textos y subtítulos que dicen que el estado inicial incluye datos de ejemplo.
- **Rol «Empresa»**: reemplaza a «Contacto de la empresa» en el selector, los avisos («Esa vista pertenece al rol Empresa. Estás como …»), el título de su vista y la lista «Quién hace qué». La cuenta del ingreso sigue siendo «Contacto Demo», con la descripción «Persona de contacto de la empresa cliente.». El botón de entrada se llama ahora «Entrar como Empresa: Contacto Demo. …».
- **Encabezado** (FR-051): menos de 768 px, dos filas (marca + «Inicio»; «Rol activo» + selector + «Restablecer»); desde 768 px, una fila. «Restablecer» a la derecha del selector, con ≥ 12 px de separación, estilo secundario (borde fino, sin relleno), 44 px de área táctil y contraste ≥ 4,5:1 (medidos en `l6c.spec.ts`); nombre accesible siempre «Restablecer demo» (la etiqueta visible abreviada está contenida en él); texto completo desde 768 px.
- **Comprobación del rol completo a 320 y 360 px** (pedida): con el diseño anterior de la fila 2, **fallaba a 320 px**: «Consultor» aparecía recortado («Consultc») porque el selector medía 104 px y necesitaba ≈ 110 px. Se resolvió sin cambiar la disposición pedida, ajustando: botón «Restablecer» de 13 px con menos relleno lateral, separación de 12 px conservada (4 px de la cuadrícula + 8 px de margen) y etiqueta «Rol activo» de 12 px. A 320 px el selector queda en ≈ 111 px: **cabe, pero con ~1 px de holgura sobre el mínimo medido**; cualquier aumento de fuente del navegador o de relleno lo volvería a recortar. Alternativa si se quiere más holgura: pasar «Restablecer» a una tercera fila solo por debajo de 340 px (no implementado). A 360 px y más hay holgura amplia.
- **Textos de restablecer**: diálogo «¿Restablecer la demo? Se borrarán tus cambios en este navegador y la demo volverá a su estado inicial, con los datos de ejemplo.» y aviso «Se restableció la demo. Volvió al estado inicial, que incluye datos de ejemplo.» (también al adoptar un restablecimiento hecho en otra pestaña).
- **Subtítulos (FR-052)**: «Proyectos» y «Tablero» añaden «Los proyectos, calificaciones y entregas iniciales son ejemplos precargados; «Restablecer demo» los recupera.». `labels.spec.ts` lo comprueba en ambas pantallas.
- **Cobertura frente a las referencias**: `docs/cobertura-referencias.md` (solo documentación; ninguna decisión nueva). 6 brechas propuestas con costo estimado (NO VERIFICADO), ordenadas por valor.

**Verificación**: `typecheck` sin errores; `npm test` 236 en verde; `build` y `check` correctos; `EVIDENCIA=1 npx playwright test` 384 pasadas y 33 omitidas; 132 capturas regeneradas con la interfaz final y salidas de axe sin violaciones.

## Lista de pulido (para L6)

Observaciones de las revisiones humanas de L1 y L2. Se atienden en la pasada de pulido de L6 (T095) salvo lo ya resuelto. Cualquier cambio de comportamiento se corrige primero en el spec.

1. ~~Separar «Restablecer demo» de la navegación lateral.~~ **Resuelto en L3** (T036A): va al pie, separado por una línea.
2. ~~Dar estilo al texto «Estás como…».~~ **Resuelto en L3** (T036A): se reemplazó por una tarjeta de cuenta («Nombre · cuenta ficticia»).
3. El ingreso a 1280 px es sobrio y podría acercarse más al estilo de las referencias.
4. ~~La barra lateral queda casi vacía en el inicio del Consultor.~~ **Resuelto en parte en L3**: ahora lleva los pasos del proyecto y el pie; revisar el aspecto en la pasada de pulido.
5. Subir «Generar diagnóstico» y el progreso de captura en pantallas pequeñas (hoy quedan al final de la página de captura).
6. Altura despareja de las tarjetas de proyecto (la lista de Proyectos).
7. ~~Menú oculto en pantallas pequeñas.~~ **Resuelto** (ajuste G, T050B): la navegación del rol es una barra de pestañas visible bajo 1024 px y «Cuenta» contiene solo la tarjeta de cuenta y «Restablecer demo». **Pendiente en T085 (README):** documentar las pestañas, el botón «Cuenta» y que «Encuesta» aparece solo si existe su pantalla (el README aún no existe).
8. Revisar el aspecto de las pestañas de un proyecto a 320 px (se acomodan en dos líneas de dos pestañas) y si la fila «← Proyectos» necesita más presencia.

## Lote L6f: encabezado adaptable, informe imprimible (L5a), recuento NO VERIFICADO y cobertura (T116 a T119)

Fecha: 2026-11-02, aprox. 11:10 a 11:35 (≈ 25 min de agente). Orden: spec (FR-051, FR-048, nuevo FR-053) → tareas → pruebas → código. La persona pidió construir L5a en esta sesión; no se registró en T100 (decisión de la persona).

1. **Encabezado (FR-051)**: bajo 768 px usa `flex-wrap`, sin cortes de ancho fijos. Fila 1: marca + «Inicio»; fila 2: «Rol activo» + selector; «Restablecer» va en la fila 2 si cabe y, si no, baja a una tercera fila alineado a la derecha. Todo en rem (el texto del botón es de 14 px a 16 px de base y crece con ella); separación ≥ 12 px. Se añadió un contenedor `role-field` (etiqueta + selector; el orden de Tab no cambia) y un separador de fila oculto. Prueba nueva `tests/e2e/l6f-encabezado.spec.ts`: 320 y 360 px × fuente de 16, 20 y 32 px (zoom 200 %) × 3 roles: rol completo, sin contenido recortado, sin solapes, 44 px, sin desborde de la cabecera, y axe. Las pruebas de L6b, L6c y de la corrección B se ajustaron (2 o 3 filas). Se corrigieron de paso desbordes de contenido a 20 px (rejillas `minmax(0, 1fr)`).
   - **Límite conocido (NO resuelto)**: con zoom de texto del 200 % a 320 px, la **pantalla Proyectos** del Consultor y alguna del Líder todavía se desplazan horizontalmente, porque «Calificada · N de 5» no se parte (T105, `white-space: nowrap`). La prueba exige «sin desplazamiento horizontal» de toda la página solo a 16 y 20 px; a 200 % lo exige a la cabecera. No es una prueba de zoom real del navegador (que además reduce el ancho en píxeles CSS): se simuló fijando el tamaño de la fuente raíz.
2. **Informe imprimible (L5a, FR-044 a FR-048)**: `src/domain/report.ts` (`reportContent`; no recibe calificaciones, así que no puede incluirlas), `PrintReport`, `ReportPage`, pantallas `Report` de ambos roles, enlaces «Ver informe imprimible» (diagnóstico emitido, estrategia, revisión de la entrega: 1 interacción) y `print.css` (solo tokens). «DEMO · datos ficticios» va en el `thead` de una tabla de maquetación para que se repita en cada página. Rótulos con texto y borde (legibles en blanco y negro). Pruebas: 8 unitarias y 12 e2e por ancho (print emulado, PDF en carta y A4 con su tamaño, aviso presente en **todas** las páginas leyendo los glifos del PDF —la prueba falla si el `thead` deja de repetirse—, teclado, axe). Ajustados `labels.spec.ts` y `helpers/routes.ts`; `UNBUILT_ROUTES` queda solo con `contacto.survey`.
   - **No verificado**: el aspecto real al imprimir en papel o guardar a PDF desde un navegador distinto de Chromium (T071). La comprobación de «legible en carta/A4» es de tamaño de página y de texto (≥ 11 pt, sin desborde), no una revisión visual de cada página.
3. **Recuento NO VERIFICADO (brecha 1, FR-053)**: texto «N hallazgo(s) NO VERIFICADO entre los aceptados o editados» o «Ningún hallazgo…» en la cola del tablero, en «Entregas por revisar» y en la revisión de la entrega. Prueba: `l6f-no-verificado.spec.ts` (P-B = 1) y unitaria. La rama «Ningún» solo está probada de forma unitaria, no en la interfaz.
4. **Riesgos: 3 o 4** (`docs/cobertura-referencias.md`): la frase «cuatro riesgos» era correcta para la plantilla pero engañosa; en P-B salen 3 porque H4 está rechazado y H5 es NO VERIFICADO (R2 queda sin respaldo). Se explicó cuándo salen 3 y cuándo 4, y se añadió un resumen de conteos por estado y referencia (35 filas: 7 incluidas, 14 simplificadas, 8 excluidas, 1 excluida provisional, 5 no tratadas).
5. **README**: enlace visible a la cobertura y el informe pasa a «incluido».

**Verificación**: `typecheck` sin errores; `npm test` 245 en verde; `npm run check` OK; `EVIDENCIA=1 npx playwright test` **429 pasadas, 41 omitidas, 1 fallo**: `restablecer.spec.ts:95` («otra pestaña…», 1280 px), que se agota esperando el botón «Sí, restablecer» («element was detached»). **No lo causan estos cambios**: sin ellos (con `git stash`) falló 3 de 8 repeticiones; con ellos, 1 de 5. Causa no investigada. Capturas regeneradas y nuevas en `docs/evidencia/capturas/L6f/`; `sc-checklist.md` actualizado (SC-014 y SC-015).

## Lote L6g: foco visible, informe, vista de la Empresa y ampliaciones de P3 (T120 a T129)

Fecha: 2026-11-02, aprox. 12:14 a 13:15 (≈ 1 h de agente). Orden pedido: L, I, J, K, D, G, F, E, H, N, registro de decisión y M. Spec primero, pruebas y después código. **Registro de decisión (2026-11-02)**: se incluyen L5a y L5b, y las piezas E, F y G amplían el alcance de P3; la constitución se enmendó a 1.0.1 (principio VII: P3 puede incluirse o ampliarse por decisión escrita de la persona responsable).

- **L. Foco visible en diálogos (FR-054)**. Causa: los diálogos de «Restablecer demo» y de cambio de rol viven dentro de la cabecera, que pone el contorno del foco en blanco (`.topbar :focus-visible`), y el diálogo es blanco: contraste 1,00:1. Corrección: el contorno de todo diálogo usa el color de tinta (también con foco por ratón, que no activaba `:focus-visible`) y el foco inicial va por código a «Cancelar» (o «Seguir editando»). Prueba `foco-visible.spec.ts`: todas las pantallas de la matriz (los 3 roles, 3 anchos) y los 4 diálogos (teclado y ratón); contorno ≥ 2 px y contraste ≥ 3:1 contra el fondo donde se pinta. **Falló antes** con el estilo actual en los 8 casos de diálogo (y las pantallas ya pasaban). Límite: mide el contorno calculado; no sustituye una revisión visual.
- **I. Prueba intermitente (`restablecer.spec.ts`, «otra pestaña…»)**. Causa **confirmada** (reproducida con una prueba determinista que falló antes): era un **defecto real de la aplicación**: al adoptar el estado de otra pestaña (p. ej. un cambio de rol hecho allí), la ruta del rol anterior deja de ser válida, `Routed` devolvía `null` durante la redirección y **desmontaba la cabecera y el diálogo de «Restablecer demo» abierto** (FR-055). Corrección: durante la redirección se conserva la cabecera de la última pantalla válida. Además la prueba tenía una **carrera propia**: B entraba como Líder justo antes de que le llegara el guardado diferido de A (restablecer); se estabilizó esperando a que A termine de guardar (sin pausas arbitrarias). Antes 3 de 8 fallos; después 48 de 48 en 12 repeticiones con 3 trabajadores.
- **J. Sensibilidad del informe imprimible**. Se rompió el código de producción una vez por vez y se restauró el original (comparado con una copia). (1) Incluir un hallazgo rechazado: lo detectó la prueba unitaria; **ninguna e2e** → se añadió una e2e que cuenta los hallazgos mostrados (7 de 8) y que el rechazado no aparece. (2) Quitar la marca NO VERIFICADO: fallaron `report.spec.ts` y `labels.spec.ts`. (3) No repetir el aviso en cada página: falla `report.spec.ts` (lectura de los glifos de cada página del PDF). (4) Abrir sin diagnóstico emitido: fallaron la unitaria y la e2e de bloqueo. (5) Rol o proyecto ajeno: solo fallaban pruebas unitarias → se añadieron 7 casos e2e (rol ajeno, proyecto inexistente, entrega no enviada, diagnóstico sin emitir). Se comprobó que las nuevas e2e fallan con (1) y (5).
- **K. Informe**: encabezado «Informe de diagnóstico», título «Informe de diagnóstico · Empresa Ficticia Beta (DEMO)» (el de cada empresa), «Revisado por: Consultor Demo» junto a la fecha de emisión; en impresión no queda ningún botón, enlace ni control visible (prueba).
- **D. Vista de la Empresa (L5b, FR-034 a FR-036)**: inicio de P-B con tres pasos derivados del estado real, próximo paso, actividad de ejemplo rotulada, informe en solo lectura (`#/contacto/informe`) y encuesta simulada de 3 preguntas (1 a 5, guardada solo en el navegador, sin envíos; una prueba verifica que no sale ninguna solicitud no GET). La Empresa solo ve P-B (sus rutas no llevan parámetros; las de otros roles la redirigen). «Restablecer demo» borra la encuesta (prueba). Se reemplazaron las pruebas que daban por «no disponible» esa vista. Desvío del plan original: 3 preguntas (no 5) y sin el campo `plainText`, por lo pedido; FR-035 ahora habla del informe en lugar del texto no técnico.
- **G. Análisis de sector y de mercado (FR-026)**: resumen de 2 frases, 3 puntos clave, «Implicación para esta empresa» derivada con la lógica de `deriveStrategy` («Deriva de…»; el hallazgo H5, NO VERIFICADO, se añadió como respaldo del mercado para poder probar que no cuenta) y «Fuentes: ninguna…». La insignia «NO VERIFICADO · contenido ilustrativo» sigue en el resumen y los puntos clave. Sin cifras (prueba). El informe imprimible los incluye (reutiliza `StrategyView`).
- **F. Datos de la empresa y documentos sugeridos (FR-056)**: valores inventados (ciudad, sitio web con dominio reservado `.example`); 4 documentos sugeridos con tipos distintos entre sí; se marcan por **extensión** de los archivos cargados por la persona (los de ejemplo de cada proyecto no cuentan); sin análisis.
- **E. Tablero del Líder (FR-057)**: «Madurez promedio (de 5)», columna «Madurez» («—» sin diagnóstico emitido) y buscador. **Nota**: como todos los diagnósticos comparten una sola plantilla, toda madurez vale 2,4; el indicador demuestra la derivación, no variedad real. Sin promedio por pilar.
- **H. Texto de la entrega**: «En la cola del Líder. Su calificación aparecerá aquí cuando la guarde.» con la insignia «Por revisar», en la estrategia enviada y en el banner del diagnóstico emitido; actualizados spec, pruebas y este registro.
- **N. Revisión manual**: registrada en `docs/evidencia/revision-manual.md` solo lo indicado (teclado, 2026-11-02, Chrome para Windows; lector de pantalla NO verificado).
- **M. Pruebas con usuarios**: se eliminó `docs/evidencia/pruebas-usuarios.md` y se retiró toda mención en documentos, spec, plan, tareas y README; SC-001 y SC-005 quedan «No evaluado en esta versión de demostración»; T022, T092 y T094 «No aplica en esta versión». Quedan palabras como «usuario» en otros sentidos (p. ej. «archivos del usuario», «multiusuario», «Usuarios y acceso» del spec).

**Verificación al cierre de L6g**: `typecheck` sin errores; `npm test` 274 en verde (26 archivos); `npm run check` OK (incluido `check-names`); `EVIDENCIA=1 npx playwright test` **522 pasadas, 51 omitidas, 0 fallos** (una sola corrida); capturas y salidas de axe regeneradas. No se hizo commit ni push.

## Prueba de sensibilidad de G, F y E (2026-11-02)

> **Nota posterior**: la lista de documentos sugeridos (y su frase «Marcado según el tipo de archivo…») que se menciona en esta sección **se retiró** el mismo día; ver «Congelamiento de alcance». Lo verificado de G y E sigue vigente.

Se rompió el código de producción una ruptura a la vez, se ejecutaron `npm test` y las pruebas e2e de estrategia, evidencia e informe (a 320 px) y se restauró el original (comparado después con una copia byte a byte). **Todas las roturas hicieron fallar alguna prueba**:

| Ruptura | Qué la detectó |
|---|---|
| G1 análisis derivado de un hallazgo rechazado | 3 unitarias (`strategy.test.ts`) y 2 e2e (`strategy-leader.spec.ts`) |
| G2 derivado de un NO VERIFICADO | 2 unitarias y 2 e2e |
| G3 sin la insignia «NO VERIFICADO · contenido ilustrativo» | solo una e2e (el conteo global de 2) |
| G3 sin la línea de «Fuentes» | solo una e2e |
| F1 un documento de ejemplo cuenta como cargado | solo una e2e (en P-A) |
| F2 marca ✓ sin cargar nada | 2 unitarias y 1 e2e |
| E1 promedio con equipos sin diagnóstico emitido | 3 unitarias y 1 e2e |
| E2 buscador que no filtra / que distingue mayúsculas y acentos | 1 unitaria y 1 e2e cada una |
| E3 indicador y columna sin coma decimal | solo una e2e cada una (no hay unitaria del formato) |

Detección débil encontrada (se cubrió con pruebas nuevas, y se volvió a romper para comprobar que fallan): G3 solo lo detectaba un conteo global y F1 solo dependía de que P-A tuviera documentos de ejemplo. Se añadieron `G (sensibilidad)` en `strategy-leader.spec.ts` (insignia y fuentes en **cada** sección) y `F (sensibilidad)` en `evidence.spec.ts` (P-B y P-C, que traen documentos de ejemplo, muestran los 4 sugeridos «Pendiente»). E3 queda cubierto solo por e2e.

**Texto de F**: la lista se marca por la extensión, así que la interfaz ahora dice «Marcado según el tipo de archivo; el contenido no se lee.» (FR-056, prueba en `evidence.spec.ts`, captura `L6g/F-evidencia-datos-y-sugeridos-{ancho}.png`).

**Comprobación final**: respecto de la copia tomada al empezar, en `src/` solo cambió `src/components/CompanyData.tsx` (esa frase). No se hizo commit.

## Congelamiento de alcance (2026-11-02, después de L6g)

-2026-11-02 (tras el commit final): suite e2e completa (`npm run test:e2e`, sin `EVIDENCIA`): 507 pasadas, 75 omitidas, 0 fallos y ninguna prueba inestable.

1. **Documentación**: la revisión manual con **teclado** se hizo el 2026-11-02 (todo funcionó salvo el foco visible del diálogo de restablecer, ya corregido); el **lector de pantalla NO se hizo** (NO VERIFICADO). Corregidos README («Límites conocidos») y SC-009 de `sc-checklist.md`, que se contradecían con la línea de teclado; también `docs/evidencia/README.md`. Quitada la fila duplicada del README sobre el análisis de sector y de mercado; reformuladas las líneas 3 y 17 del README («Permite recorrer…», «Muestra si…», «no hay análisis real»); la sección pasó a «Alcance: qué se incluyó y qué se recortó». **SC-004** pasó a «Verificado (auto)» porque `labels.spec.ts` sí recorre los informes (Consultor, Líder y Empresa), el inicio de la Empresa y la encuesta: su tabla de expectativas debe cubrir exactamente las rutas construidas (lo comprueba una prueba).
2. **Se quitó la lista de «documentos sugeridos»** de la captura de evidencia (FR-056 actualizado; se conservan la tarjeta «Datos de la empresa (ficticios)» y la carga libre). Motivo: la demo no lee el contenido, no puede saber qué documento se subió, y la lista induce a pensar que hay que subir esos nombres; el sistema real sí podrá hacerlo al leer los documentos. Se eliminaron `src/data/suggested.ts`, `src/domain/suggested.ts`, `tests/unit/suggested.test.ts` y las pruebas e2e F1/F2; quedó una e2e de la tarjeta y la unitaria de los datos de la empresa. En `docs/cobertura-referencias.md` la fila pasa a «Excluido por decisión» (resumen: 8 incluidas, 16 simplificadas, 8 excluidas, 3 no tratadas).
3. **Madurez distinta por equipo (FR-058)**. Dónde estaba: un solo `maturityIndex: 2.4` en la plantilla `src/data/diagnosis.ts`; **no existe ningún dato por pilar** (los hallazgos solo tienen pilar, sin puntaje) y no se inventó ninguno. Ahora hay un valor **ilustrativo, ficticio y sembrado por proyecto** (`SEEDED_MATURITY` en `src/data/projects.ts`): Beta (P-B) 2,4; Gamma (P-C) 3,1; Zeta (E-2) 1,8; Eta (E-3) 2,8. Épsilon (E-1, con diagnóstico emitido en los datos de ejemplo) y P-A (el que se genera en la sesión) conservan 2,4 de la plantilla; así el promedio de los 5 diagnósticos emitidos da **2,5** exacto (con los cuatro valores pedidos y sin E-1 daría 2,525, también «2,5»). Equipo 1 promedia P-B y P-C: 2,75, que se muestra «2,8». Lo muestran el diagnóstico, la entrega del Líder, el informe, el inicio de la Empresa (línea nueva, necesaria para cumplir lo pedido) y el tablero, siempre con «(ilustrativo, ficticio)». Pruebas: unitarias (valores por proyecto, promedios por equipo y global) y e2e (tablero, diagnóstico, entrega, informe, Empresa, P-A). **Sensibilidad**: se rompió el promedio para que cuente como cero a los equipos sin diagnóstico emitido; fallaron 5 unitarias y la e2e del tablero; restaurado.
4. **Fechas**: **no mezclan hora local y UTC**. Todo pasa por una sola función, `formatDateTime`, que formateaba en la zona del navegador; los datos de ejemplo están escritos en UTC con horas redondas (p. ej. emitido 15:00 UTC, actividad 09:00 UTC, calificación 11:30 UTC), que en hora de Bogotá se ven 10:00, 4:00 y 6:30. Se fijó la zona `America/Bogota` en esa función (prueba unitaria que falló antes: la hora cambiaba con la zona). Las horas madrugadoras que quedaban (4:00, 5:00, 6:30) se corrigieron después, ver «Horas sembradas a horario de oficina».
5. **Explicación (sin cambios)**: P-A muestra «Evidencia: Completado» porque ese paso se completa con **al menos un elemento de evidencia**, y P-A trae 5 elementos de evidencia de ejemplo precargados (`sampleSlots` 1 a 5). El progreso de captura es otra cuenta: cada una de las 5 preguntas respondidas es un paso y tener evidencia es un paso más, 6 pasos en total; P-A tiene 0 preguntas respondidas y evidencia, así que 1 de 6 = 17 %.

**Verificación (no se re-ejecutó la suite completa tras este cambio)**: `typecheck` sin errores; `npm test` 276 en verde; `npm run check` OK; e2e solo de las pantallas afectadas (evidencia, informe, tablero, labels, matrix de las rutas tocadas, Empresa y recorrido P1), con capturas regeneradas del tablero, el informe y la captura de evidencia.

## Horas sembradas a horario de oficina (2026-11-02)

Solo datos de ejemplo: los instantes que se veían fuera de 08:00–17:00 (hora de Bogotá) se movieron a horas en punto o y media, **conservando el día** y el orden cronológico. Lo que ya estaba dentro del horario no cambió.

| Dato (`src/data/projects.ts`, `src/data/survey.ts`) | Antes (Bogotá) | Ahora (Bogotá) |
|---|---|---|
| Diagnóstico generado (19 oct) / emitido (20 oct) / estrategia generada (22 oct) | 09:00 / 10:00 / 11:00 | sin cambio |
| Estrategia enviada de P-C (23 oct) | 04:00 | 14:00 |
| Calificación `dx/P-C` (24 oct) | 05:00 | 10:00 |
| Calificación `dx/E-1` (25 oct) | 04:15 | 09:30 |
| Calificación `st/P-C` (27 oct) | 06:30 | 11:30 |
| Actividad de la Empresa: revisión del diagnóstico (20 oct) | 05:00 | 09:00 (antes de la emisión, 10:00) |
| Actividad: documentos recibidos (14 oct) | 10:30 | sin cambio |
| Actividad: primera conversación programada (8 oct) | 04:00 | 08:30 |

Orden conservado: generado → emitido (20 oct) → estrategia generada (22) → enviada (23) → calificaciones (24, 25 y 27). No había textos de hora de estos datos en `tests/` ni en `docs/` (las pruebas de formato usan sus propios instantes). Verificación: `typecheck`, unitarias, `check` y e2e de strategy-leader, report, tablero, Empresa, labels, p1-journey, matrix y capturas afectadas; no se re-ejecutó la suite completa.

