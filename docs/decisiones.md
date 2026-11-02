# Registro de decisiones

## Estado de la sesión

- **Lote cerrado**: L6 (cierre) en lo que no es de la persona (T081 a T092), más las correcciones A a C. L4 ya está en el commit `7c9c329`. **Pendientes de la persona**: T022, T093 (revisión manual de teclado y lector de pantalla), T094 (pruebas con 2 o 3 personas), T095 (pulido), T096 (volcar resultados; depende de T094 y T095), T097 a T100 (revisión final, commit, publicación y decisión sobre P3).
- **Tiempos del agente**: L1 15:34 a 15:48; L2 16:06:58 a 16:18; L3 16:48:07 a 17:04:02; ajustes F a I y L4 18:49:51 a 19:06:55; siete ajustes previos al commit de L4 (sin hora de inicio registrada); correcciones A a C y L6 19:52:15 a 20:17:38 (25 min con pausas). Acumulado de agente ≈ 1,3 h (más revisiones humanas); los puntos de control de L1, L3 y L4 se cumplen con holgura.
- **Verificación al cierre de L6**: `typecheck` sin errores; `npm test` 231 en verde; `npm run build` y `BASE_PATH=/mi-repo/ npm run build` correctos; `npm run check` OK; `EVIDENCIA=1 npx playwright test` 325 pasadas y 8 omitidas.
- **Qué sigue**: la persona completa T093 a T100. La decisión sobre L5a y L5b (T100) se toma con las horas acumuladas y los resultados de las pruebas con usuarios.

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
| Banner «Emitido» | «Se creó la entrega visible para el Líder.» | «El Líder podrá calificarlo cuando quiera. No bloquea tu trabajo: puedes continuar con la estrategia.» |
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
- README honesto, `docs/evidencia/` (README, revisión manual, checklist de SC, pruebas con usuarios, correspondencia de `quickstart.md`) y la licencia OFL en `public/licenses/OFL-PlusJakartaSans.txt` (se verificó que `dist/licenses/` la incluye).
- **Conciliación (T090)**: se corrigieron `plan.md` y `contracts/routes.md` (pestañas en vez de menú, «Opciones», «Disponible», el Contacto de la empresa sin navegación mientras no exista su vista) y la «Línea de corte» de L5b en `tasks.md` (la ruta `#/contacto` se conserva con su mensaje). El spec ya estaba al día por los ajustes anteriores. Los escenarios de `quickstart.md` **no se ejecutaron a mano**: `docs/evidencia/quickstart-resultados.md` dice qué prueba automática cubre cada uno.
- **SC-001 y SC-005 figuran «NO VERIFICADO» / «indicativo (n = …)»**: no se hicieron pruebas con usuarios y no se inventó ningún resultado.
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
