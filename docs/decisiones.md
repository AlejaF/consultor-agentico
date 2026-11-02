# Registro de decisiones

## Estado de la sesión

- **Lote cerrado**: L4 (Estrategia y Líder), más los ajustes F a I previos. **Cierra P2** en código. Pendientes de la persona: T022 (convocar participantes), T049/T050 (L3, si aún no), T063 y T064 (L4: revisión y commit).
- **L1**: 15:34 a 15:48 (UTC-5), unos 12 min. **L2**: 16:06:58 a 16:18. **L3**: 16:48:07 a 17:04:02 (15 min 55 s).
- **Ajustes F a I + L4**: 18:49:51 a 19:06:55 (17 min con pausas).
- **Punto de control**: acumulado de agente L1 a L4 ≈ 0,9 h (más las revisiones humanas); el límite de L4 (≤ 9,0 h) se cumple con holgura.
- **Qué sigue**: revisión humana de L4 (T063), commit y push (T064) y, después, L6 (pulido, README T085, pruebas con usuarios); la decisión sobre L5a/L5b se toma al final de L6.

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
