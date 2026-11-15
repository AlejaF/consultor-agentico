# Listas de revisión corta de la especificación 002 «Agente real con IA»

Una lista por lote, de **máximo 10 minutos**, para la persona responsable. Cada lista dice qué comando correr, qué abrir y qué comprobar.
La escribe el agente al cerrar el lote; la revisión y el commit son de la persona (principio VIII). Los lotes C y D exigen además una
revisión a fondo (lectura del código y recorrido manual), que no cabe en estos 10 minutos.

## Lote A — Base y seguridad (revisión corta)

**Qué se hizo, en palabras simples**: se creó el «servicio local» (una carpeta `server/` que solo se enciende en tu computador y que
más adelante hablará con OpenAI), se puso un «vigilante de claves» (`check-secrets`) que hace fallar `npm run check` si alguna clave
se cuela en el repositorio o en la página publicada (`dist/`), y se dejó la configuración lista sin ningún modelo elegido.
**Todavía no hay IA**: el servicio solo contesta «estoy vivo» y la demo se ve exactamente igual que antes.

1. **Correr** (2 min): `npm run typecheck:all && npm run test:all && npm run build && npm run check`.
   **Comprobar**: todo termina sin errores; `check` imprime tres líneas «OK» (nombres, tokens y secretos).
2. **Correr** (2 min): `npm run dev:server`, y en otra terminal `curl http://127.0.0.1:8787/api/health`.
   **Comprobar**: responde `"ok":true`, `"keyConfigured"` según tengas o no `server/.env`, los tres modelos en `null`
   (no hay modelo por defecto), y **no aparece ninguna clave**. Detén el servicio con Ctrl+C.
3. **Correr** (1 min): `curl -H 'Host: malo.example' http://127.0.0.1:8787/api/health`.
   **Comprobar**: responde `403` (el servicio rechaza visitas que no son de tu computador).
4. **Correr** (1 min): `git check-ignore -v server/.env.example server/.env` y `git status --short`.
   **Comprobar**: `server/.env.example` aparece como **no ignorado** (línea con `!`), `server/.env` como **ignorado**, y `git status`
   no muestra ningún `.env`.
5. **Abrir** (2 min): `docs/evidencia/seguridad-a.md` y `server/.env.example`.
   **Comprobar**: la prueba de «clave falsa» falló donde debía (archivo versionado y `dist/`) y pasó al quitarla; el ejemplo trae
   todas las variables **sin valores**.
6. **Abrir** (1 min): `docs/decisiones.md` («Estado de la sesión») y `docs/tiempos-002.md`.
   **Comprobar**: el lote A figura cerrado y la fila del lote A tiene tiempos medidos (lo no medido está en blanco).
7. **Mira el modo Simulado** (1 min): `npm run dev` y abre la demo.
   **Comprobar**: se ve y funciona igual que antes (ingreso, roles, diagnóstico simulado). El botón «Restablecer demo» sigue.

**Antes del commit (tareas tuyas)**: crear tu clave y `server/.env` (T018); `npm run build && npm run check` con la lista de nombres
presente (T020). **No pegues la clave en el chat.**

## Lote B — Extracción y verificador (revisión corta)

**Qué se hizo, en palabras simples**: el servicio local ahora sabe **recibir archivos** (PDF, Word, Excel, TXT, VTT, SRT), **leer su texto**
y guardarlo **solo en su memoria** (nunca en el disco), anotando de dónde viene cada frase (página, párrafo, hoja y fila, línea o minuto).
También tiene el **verificador de citas**: una función que comprueba, sin IA, que una frase citada está de verdad en el documento.
Si un archivo no se puede leer (PDF escaneado, con contraseña o dañado), dice el motivo en español. Se crearon 12 archivos de ejemplo
ficticios para probar. **Todavía no hay IA ni cambios en lo que ves en la demo.**

1. **Correr** (2 min): `npm run typecheck:all && npm run test:all && npm run build && npm run check`.
   **Comprobar**: todo termina sin errores; `check` imprime tres «OK».
2. **Abrir** (2 min): la carpeta `tests/fixtures/`.
   **Comprobar**: hay 12 archivos; ábrelos (el PDF, el Word y el Excel con tu programa) y confirma que **todo es ficticio** («Empresa Ficticia Alfa»,
   «documento de ejemplo ficticio»). `escaneado.pdf` se ve como una página con un recuadro gris y sin texto; `cifrado.*` y `danado.*` no se abren a propósito.
3. **Correr** (3 min): `MODEL_PROVIDER=fake npm run dev:server` y, en otra terminal:
   `curl -s -F "files=@tests/fixtures/politica-datos.pdf" -F "files=@tests/fixtures/escaneado.pdf" "http://127.0.0.1:8787/api/evidence?projectId=P-A"`.
   **Comprobar**: el primero sale `"status":"extracted"` (con cuántos caracteres y fragmentos) y el segundo `"status":"failed"` con el motivo
   «parece escaneado… no usa OCR». La respuesta **no** trae el texto del documento. Luego `curl -s http://127.0.0.1:8787/api/evidence/P-A`
   lista ambos. Detén el servicio con Ctrl+C y vuélvelo a encender: la lista queda **vacía** (la memoria se pierde, como debe ser).
4. **Correr** (1 min): `ls /tmp | wc -l` antes y después de la prueba anterior.
   **Comprobar**: no aparecen archivos nuevos (nada se guarda en disco).
5. **Abrir** (1 min): `server/src/verify.ts` (corto, unas 40 líneas).
   **Comprobar**: la regla es «el fragmento debe estar dentro del texto de **esa** ubicación, ignorando mayúsculas, tildes y espacios»,
   y con menos de 20 caracteres no vale.
6. **Abrir** (1 min): `docs/decisiones.md` («Estado de la sesión» y «Lote B de la 002») y `docs/tiempos-002.md`.
   **Comprobar**: el lote B figura cerrado, con las desviaciones anotadas, y la fila de tiempos tiene lo medido.
7. **Mira el modo Simulado** (1 min): `npm run dev` y abre la demo. **Comprobar**: se ve igual que antes.

**Antes del commit (tareas tuyas)**: T044 (esta revisión; si tienes un documento propio de ejemplo **ficticio**, súbelo con el `curl` del paso 3),
T045 (`npm run build && npm run check` con tu lista de nombres) y T046 (commit). **No abras ni pegues `server/.env`.**

## Lote C — lista de revisión corta (máx. 10 minutos de comprobación)

**Qué se hizo, en palabras simples**: el servicio local ahora tiene un **agente de Diagnóstico**: un programa que le pide a la IA que busque en tus
documentos, anote hallazgos y **cite frases literales**; el servicio comprueba **sin IA** que cada frase esté de verdad en el documento y, si no,
se lo devuelve a la IA para que la corrija (máximo 2 veces). Si la IA se equivoca al llamar una herramienta, el error vuelve a la IA y no rompe
nada. Si se acaba el dinero o el saldo, **se detiene al instante, sin reintentar**. Toda corrida deja una **traza** (qué hizo, modelo, tokens).
**Todavía no hay pantalla ni IA real probada**: todo se probó con una IA «de mentira» guionada, sin gastar un centavo. El modo Simulado no cambió.

1. **Correr** (2 min): `npm run typecheck:all && npm run test:all && npm run build && npm run check`.
   **Comprobar**: todo sin errores (`test:all`: 293 de la 001 + 125 del servicio); `check` imprime tres «OK».
2. **Correr** (1 min): `npm run test:server`.
   **Comprobar**: 12 archivos de prueba en verde, entre ellos `loop`, `tools-diagnosis`, `injection`, `diagnosis-route` y `model-client`.
3. **Abrir** (3 min): `server/src/agent/loop.ts` (unas 80 líneas). **Comprobar a la vista tres cosas**:
   a) una llamada con argumentos mal formados **no rompe** (la función `executeToolCall` en `tools.ts` devuelve `{ ok: false, error }` y nunca lanza);
   b) un error de gasto **termina con una sola llamada**: en el `catch` del bucle se devuelve `status: 'error'` y no hay ningún `continue` ni reintento;
   c) en `diagnosis.ts`, `verified: true` solo se asigna cuando **todas** las citas pasaron el verificador (busca `verified: true`: aparece en dos sitios, ambos con citas ya verificadas).
4. **Abrir** (1 min): `server/src/model/openai.ts`. **Comprobar**: `maxRetries: 0`, `store: false`, y que los mensajes de error son frases fijas (no incluyen la clave).
5. **Abrir** (1 min): `docs/evidencia/humo-real.md`. **Comprobar**: **todavía no existe**; se crea cuando tú corres la prueba de humo (T064). No hay ninguna clave en el repositorio (`npm run check` lo confirma).
6. **Abrir** (1 min): `specs/002-agente-real/research.md` §3 («Re-verificación, T048») y §17. **Comprobar**: la fecha (2026-11-12), los IDs y precios leídos, y lo que quedó **NO VERIFICADO**.
7. **Mira el modo Simulado** (1 min): `npm run dev` y abre la demo. **Comprobar**: se ve igual que antes.

**Tareas tuyas del lote C**: T049 (decidir modelos en `server/.env`; la decisión ya está en `docs/decisiones.md`, faltan los IDs en el `.env` y el nivel de razonamiento), T064 (prueba de humo real, con costo: `npm run dev:server` y en otra terminal `node scripts/smoke-real.mjs`), T065 (revisar la traza), T066 (pasar las cifras a `docs/tiempos-002.md`), T068 (revisión a fondo), T069, T070 (commit), T071 y T072 (punto de control). **No abras ni pegues `server/.env`.**


## Lote D — lista de revisión corta (máx. 15 minutos de comprobación)

**Qué se hizo, en palabras simples**: la demo ahora tiene un **interruptor «Simulado / IA real»** en cada proyecto. En «Simulado» todo funciona como
siempre. En «IA real» subes tus archivos a un programa que corre **en tu propio equipo**, este los lee, le pide a la IA que busque y anote hallazgos con
frases literales, y comprueba **sin IA** que cada frase exista de verdad en el documento. Los hallazgos reales entran al **mismo recorrido de siempre**
(revisar, emitir, calificar, informe), con el rótulo «Generado por IA (modelo …) · requiere revisión humana» y el aviso «Extracto de tu archivo» en las
citas. Una vez que un proyecto tiene diagnóstico, **su modo queda fijado** (se puede cambiar solo limpiando un diagnóstico aún no emitido). Todo se probó con
una IA «de mentira» guionada: **no se gastó nada ni se usó ninguna clave**. La estrategia con IA real **todavía no existe** (es el lote E).

**Lo que corrió el agente** (resultado en `docs/decisiones.md`, «Estado de la sesión»): `typecheck:all`, `test:all`, `build`, `check` y **una sola vez** la suite
e2e completa (`npm run test:e2e`: la de la 001 con el modo Simulado **sin modificar ni una prueba**, más la nueva del modo IA real).

1. **Correr** (3 min): `npm run typecheck:all && npm run test:all && npm run build && npm run check`.
   **Comprobar**: sin errores; `check` imprime tres «OK».
2. **Correr** (1 min): `git diff --stat -- tests/unit tests/e2e`.
   **Comprobar**: **no sale ninguna línea** (ninguna prueba de la 001 se tocó; solo hay archivos nuevos: `git status --short tests`).
3. **Modo Simulado igual que antes** (2 min): `npm run dev`, entra como Consultor y abre un proyecto. **Comprobar**: sale una tarjeta nueva «Modo de análisis»
   con «Simulado» activo y «IA real» apagado, con el mensaje «IA real no disponible aquí (requiere ejecutar el backend en tu equipo)»; lo demás es como lo conocías
   (generar diagnóstico, revisar, emitir, informe).
4. **Recorrido de IA real sin gastar** (6 min): `npm run dev:all` **con** `MODEL_PROVIDER=fake` y `OPENAI_MODEL_DIAGNOSTICO=cualquier-nombre` en el entorno
   (el servicio no gasta nada en modo falso; sin guion, la IA falsa no registra hallazgos, así que para ver hallazgos usa la prueba automática del paso 5).
   **Comprobar**: «IA real» se activa; sale el aviso azul que nombra a **OpenAI** y dice «no lo guarda en disco»; al subir un archivo aparece «Texto extraído» o el
   motivo concreto de por qué no se pudo leer (escaneado, con contraseña, dañado).
5. **Ver el recorrido completo** (2 min): `npm run test:e2e:real` (arranca solo el servicio en modo falso). **Comprobar**: todas verdes; cubre cargar los 6 formatos,
   hallazgos con «Extracto de tu archivo», la «Traza del agente», revisar → emitir → informe, error de saldo sin reintento, recargar la página.
6. **Abrir** (1 min): `src/providers/index.ts` (`getDiagnosis`). **Comprobar**: en modo Simulado devuelve la plantilla de la 001 sin cambios; en modo real, solo los
   hallazgos reales (nunca se mezclan).
7. **Revisión humana a fondo (T093, la tuya)**: recorrido en celular, tableta y computador, solo con teclado, y lectura del refactor de T082 (`git diff` de
   `src/components/PillarGroups.tsx`, `DerivedFrom.tsx`, `UnverifiedCount.tsx`, `SideNav.tsx`, `src/domain/report.ts`, `maturity.ts`, `src/state/reducer.ts`).

**Lo que NO se probó con IA real**: nada de este lote se probó con el modelo real (eso fue el lote C). Tampoco se probó el sitio publicado.

**Tareas tuyas del lote D**: T093 (revisión), T094 (`npm run build && npm run check` con tu lista de nombres), T095 (commit) y T096 (push y comprobar el sitio publicado).

## Lote D2 — madurez en modo real (lista corta, máx. 15 min)

**Para quien no es técnico**: ahora, cuando la IA analiza tus documentos, además de los hallazgos propone **un nivel de 1 a 5 por cada una de las seis áreas** (estrategia, infraestructura, datos, gobernanza, talento y cultura). Cada nivel dice «basado en N hallazgos» y de cuáles viene. **El promedio (el «índice») lo calcula el programa, nunca la IA**, y solo cuenta los niveles cuyos hallazgos **tú aceptaste o editaste** y que están verificados. Si rechazas todos los hallazgos de un nivel, ese nivel sale del promedio. Un área sin hallazgos verificados dice «Sin evidencia suficiente · NO VERIFICADO». Los proyectos simulados **no cambian** en nada.

**Lo que corrió el agente**: `typecheck:all`, `test:all` (368 + 170), `build`, `check`, diez mutaciones y **una sola vez** la suite e2e (`npm run test:e2e`, 10,4 min): la de la 001 igual que siempre (507 pasadas, 75 omitidas, 0 fallos) y la del modo IA real con **7 fallos**, todos en la prueba nueva de madurez (ver abajo).

1. **Correr** (3 min): `npm run typecheck:all && npm run test:all && npm run build && npm run check`. **Comprobar**: sin errores; 368 + 170 pruebas verdes; `check` con tres «OK».
2. **Correr** (1 min): `git diff --stat -- tests/unit tests/e2e src/domain/review.ts`. **Comprobar**: solo aparecen `tests/e2e/ia-real.spec.ts` (2 aserciones), `tests/e2e/fixtures/guion-servicio.json` y `tests/unit/realFindings.test.ts` (título), todos de la 002; **`review.ts` no sale** y ninguna prueba de la 001.
3. **Correr** (2 min): `npx playwright test -c playwright.real.config.ts tests/e2e/ia-real-madurez.spec.ts` (decide tú; el agente no la repitió por tu regla de una sola corrida). **Comprobar**: las 18 pruebas verdes. **Si siguen fallando**, puede haber un defecto real: avisa al agente.
4. **Ver con tus ojos** (5 min): `npm run dev:all` con `MODEL_PROVIDER=fake` y `OPENAI_MODEL_DIAGNOSTICO=cualquier-nombre`; elige «IA real», sube archivos, genera. **Comprobar**: aparece «Madurez por dimensión» con seis áreas y el índice en «—»; en «Revisión», al aceptar hallazgos aparecen los números y el índice cambia; al rechazar todos los de un nivel, pasa a «Sin respaldo vigente». **No debe haber botones de aceptar/rechazar en los niveles.** (Con el guion vacío de ese modo no salen hallazgos: para ver niveles usa el paso 3.)
5. **Abrir** (2 min): `docs/evidencia/mutacion-d2.md`. **Comprobar**: las 10 mutaciones tienen «Pruebas que fallaron» mayor que 0 y «restaurado idéntico: sí». Esto demuestra que las pruebas **sí detectan** un nivel sin hallazgos verificados.
6. **Leer** (2 min): `docs/evidencia/d2-rojo.md`. **Comprobar** que entiendes la desviación: las pruebas de pantalla (e2e) no se vieron fallar antes de programar.
7. **Tablero del Líder** (1 min): con los datos de ejemplo **no** debe verse la nota de mezcla; solo aparece tras emitir un diagnóstico real.

**Pendiente tuyo**: aprobar la enmienda ya está hecho; T156 (esta revisión), T157 (`build && check` con tu lista de nombres) y T158 (commit). **Hasta D3**, el rótulo de IA todavía muestra el nombre del modelo (desviación transitoria).


## Lote D3 — presentación y roles (lista corta, máx. 10 min)

**Para quien no es técnico**: ahora el cartel «Generado por IA · requiere revisión humana» ya **no dice qué modelo de IA se usó**. Esos datos técnicos (modelo, fecha, tokens y los pasos del agente) quedan solo en dos sitios y **solo para el Consultor y el Líder**: el desplegable «Ver cómo trabajó el agente» (cerrado al entrar) y la «Ficha técnica» al final del informe. **La Empresa no ve nada de eso**, ni siquiera escondido. Si la IA se quedó a medias o hubo un error, el aviso se ve **sin abrir** el desplegable. La lista «Información que habría hecho falta» ahora se llama «Evidencia sugerida para fortalecer el diagnóstico» y dice que son sugerencias de la IA.

1. **Consultor** (3 min): `npm run dev:all`, elige «IA real», genera un diagnóstico (con `MODEL_PROVIDER=fake`). **Comprobar**: los carteles de IA no nombran modelo; «Ver cómo trabajó el agente» aparece cerrado, se abre con Enter y muestra modelo, fecha y tokens; «Evidencia sugerida…» trae la frase de sugerencias.
2. **Líder** (2 min): cambia a «Líder» y abre la entrega del proyecto, luego su informe. **Comprobar**: ve el desplegable cerrado y, en el informe, la «Ficha técnica» al final.
3. **Empresa** (2 min): cambia a «Empresa» y abre su informe. **Comprobar**: no hay ficha técnica, ni desplegable, ni modelo, ni fecha de corrida, ni avisos técnicos. Pruébalo también al imprimir (vista previa).
4. **Anchos** (2 min): repite 1 a 3 reduciendo la ventana a 320 px y a 768 px. **Comprobar**: no hay barra de desplazamiento horizontal.
5. **Abrir** (1 min): `docs/evidencia/mutacion-d3.md`. **Comprobar**: cada mutación hizo fallar al menos una prueba; lee la nota honesta sobre M1.

**Pendiente tuyo**: T175 (esta revisión), T176 (`build && check` con tu lista de nombres) y T177 (commit).


## Lote E — Estrategia con IA real (lista corta, máx. 15 min)

**Para quien no es técnico**: con el diagnóstico real ya emitido, la pantalla «Estrategia» ahora deja pedirle a la IA riesgos y una ruta por fases. **Cada elemento dice de qué hallazgos sale** («Deriva de…»). El programa (no la IA) comprueba que esos hallazgos existan, estén verificados y hayan sido aceptados o editados por ti; si no, **el elemento se descarta**. Si no hay ningún hallazgo así, no se llama a la IA. Si la IA falla, se avisa «Estrategia real no disponible» y **no se pone la estrategia de ejemplo**. No hay análisis de sector ni de mercado en modo real. Los datos técnicos (modelo, fecha, tokens) solo los ven Consultor y Líder.

1. **Correr** (3 min): `npm run typecheck:all && npm run test:all && npm run build && npm run check`. **Comprobar**: sin errores y todo en verde.
2. **Consultor** (5 min): `npm run dev:all` con `MODEL_PROVIDER=fake` y los modelos con cualquier nombre (incluido `OPENAI_MODEL_ESTRATEGIA`); elige «IA real», genera y emite un diagnóstico y abre «Estrategia». **Comprobar**: aparece «Generar estrategia con IA real»; al generar, cada riesgo y fase trae «Deriva de: R… · título (Pilar)»; el rótulo dice «Generado por IA · requiere revisión humana» **sin modelo**; no hay secciones de sector ni mercado; «Ver cómo trabajó el agente» está cerrado. (Con el guion vacío del modo falso no salen elementos: para ver elementos usa `npx playwright test -c playwright.real.config.ts tests/e2e/ia-real-estrategia.spec.ts --headed`.)
3. **Sin respaldo** (2 min): emite un diagnóstico donde solo aceptes el hallazgo NO VERIFICADO. **Comprobar**: la pantalla explica que no hay con qué generar y no ofrece el botón.
4. **Líder y Empresa** (3 min): envía la estrategia, cambia a «Líder» y abre la entrega; luego a «Empresa» y abre su informe. **Comprobar**: el Líder ve la estrategia, la traza cerrada y la «Ficha técnica» en el informe; la Empresa no ve nada técnico.
5. **Abrir** (2 min): `docs/evidencia/mutacion-e.md`. **Comprobar**: las 13 mutaciones hicieron fallar alguna prueba y quedaron restauradas; lee la nota de M12.

**No se pudo comprobar con ojos humanos en la pantalla** que desaparece un elemento al rechazar un hallazgo: un diagnóstico emitido no se puede cambiar, así que eso solo lo prueban las pruebas unitarias.

**Pendiente tuyo**: T107 (esta revisión), T108 (`build && check` con tu lista de nombres), T109 (commit) y T110 (push, solo cuando lo decidas).


## Lote N — Nuevo proyecto (lista corta, máx. 10 min)

**Para quien no es técnico**: el Consultor ya puede crear una empresa nueva («+ Nuevo proyecto»), subir sus documentos y recorrer todo el flujo con IA real hasta la Estrategia. El proyecto nuevo se guarda solo en este navegador y no tiene modo Simulado. Los 7 proyectos de ejemplo no cambian.

1. **Crear** (3 min): `npm run dev:all` con `MODEL_PROVIDER=fake`; entra como Consultor y pulsa «+ Nuevo proyecto». Prueba un nombre vacío, uno repetido (p. ej. «empresa ficticia alfa») y uno válido. **Comprobar**: los errores se leen claros; el proyecto nuevo aparece «Creado por ti», Pendiente, 0 %, y te lleva a Evidencia.
2. **Solo IA real** (1 min): en el proyecto nuevo, el botón «Simulado» está apagado y dice «El modo Simulado solo está disponible en los proyectos de ejemplo».
3. **Recorrido** (3 min): sube un archivo, genera, revisa, emite, genera la Estrategia y envíala; cambia a Líder y mira el tablero (Equipo 1 con 5 proyectos), la entrega y la calificación.
4. **Sin servicio** (1 min): abre solo `npm run dev` (sin servicio). **Comprobar**: el botón sale apagado y se lee «Requiere IA real (ejecutar la app en tu equipo)».
5. **Recarga y restablecer** (2 min): recarga (el proyecto sigue). Pulsa «Restablecer demo»: debe decir cuántos proyectos creados se borrarán y pedir confirmación; «Cancelar» no borra nada.

**Para probar con la API real** (tú): crea una empresa con tu nombre real, sube sus documentos y genera. NO VERIFICADO con el modelo real.

**Pendiente tuyo**: T190 (esta revisión, `build && check` con tu lista de nombres y commit).


## Lote H — capa visual (lista corta, máx. 10 min)

**Para quien no es técnico**: solo cambia cómo se ve. La madurez sale en barras (con el número y la etiqueta también en texto), el nivel general en una tarjeta, los hallazgos en tarjetas con etiquetas de pilar y estado, y la revisión y el tablero del Líder traen cifras. Las reglas, los textos y la traza no cambiaron.

1. **Madurez** (3 min): `npm run dev:all` con `MODEL_PROVIDER=fake`, genera un diagnóstico real y abre «Revisión». Acepta hallazgos. **Comprobar**: cada dimensión tiene una barra con su número; las dimensiones «Sin evidencia suficiente» o «Sin respaldo vigente» tienen una barra vacía rayada, con la etiqueta y **sin número**; un nivel menor a 2 dice «Bajo (<2)».
2. **Tarjeta y cifras** (2 min): la tarjeta «Nivel general» dice «estimado por IA» (real) o «ilustrativo, ficticio» (en P-C, simulado); sin índice dice «—». Las cifras y la barra de colores cambian al aceptar o rechazar.
3. **Estrategia y tablero** (2 min): en la Estrategia cada elemento muestra «Deriva de» con etiquetas R1, R2…; como Líder, el Tablero trae «Madurez por pilar (promedio)» y conserva la nota de mezcla.
4. **Blanco y negro** (2 min): abre el informe y pulsa imprimir (vista previa en blanco y negro). **Comprobar**: todos los valores se leen sin color.
5. **Anchos y capturas** (1 min): reduce la ventana a 320 px (sin barra horizontal) y mira `docs/evidencia/h-*.png`.

**Pendiente tuyo**: T203 (esta revisión, `build && check` con tu lista de nombres y commit).


## Lote H2 — rediseño visual de composición (lista corta, máx. 10 min)

**Para quien no es técnico**: la aplicación se ve como un tablero: barra lateral de color con el paso activo en píldora blanca, títulos con etiqueta encima, tarjetas con sombra suave, y la madurez en dos columnas (nivel general grande a la izquierda, seis barras a la derecha). Las reglas no cambiaron.

1. **Escritorio** (3 min): `npm run dev:all` con `MODEL_PROVIDER=fake`; entra como Consultor, genera un diagnóstico real y acepta hallazgos en «Revisión». **Comprobar**: tarjeta de nivel general grande en color primario, una sola escala 1–5 encima de las barras, cada dimensión con una línea corta y chips «R1…»; «Sin evidencia suficiente» con barra rayada y sin número; el rótulo «Generado por IA · requiere revisión humana» una vez junto al título del bloque.
2. **Hallazgos** (2 min): tarjetas en cuadrícula; el botón elegido (Aceptar, Rechazar) se ve relleno con ✓; las citas se leen como fuente subrayada.
3. **Imprimir** (2 min): abre el informe y la vista previa de impresión (en blanco y negro). **Comprobar**: sin barra lateral; el detalle de cada dimensión sale abierto; el rótulo de IA se ve.
4. **Tablero del Líder y Proyectos** (2 min): cifras de igual altura, la primera en color; «Cola de revisión» y «Madurez por pilar (promedio)» en dos columnas (la segunda solo si hay un proyecto real emitido); tarjetas de proyecto alineadas.
5. **Móvil y tablet** (1 min): reduce la ventana a 768 y 320 px: mismos colores (la barra de pestañas también es de color), sin barra de desplazamiento horizontal. Mira `docs/evidencia/h2-*.png`.

**Pendiente tuyo**: T215 (esta revisión, `build && check` con tu lista de nombres y commit). **Pendiente documentado (P3)**: chips y barra de avance dentro de las filas de la tabla de equipos.


## Lote H3 — composición y gráficos (lista corta, máx. 10 min)

**Para quien no es técnico**: la pantalla aprovecha el ancho (resumen y madurez a un lado, hallazgos en varias columnas) y hay gráficos que responden una pregunta cada uno. Nada de las reglas cambió.

1. **Revisión a 1280 px** (3 min): `npm run dev:all` con `MODEL_PROVIDER=fake`; genera un diagnóstico real y abre «Revisión». **Comprobar**: la columna derecha (avance con «Aprobar y emitir» y madurez) se queda fija al bajar; los hallazgos van en 2 columnas; «Estado de la revisión» es una barra con leyenda y cifras; «Cobertura de evidencia» tiene celdas rayadas con «sin evidencia» y sin número. Pulsa «Ver como tabla» y pasa el teclado (Tab) por las celdas: aparece la etiqueta.
2. **Estrategia** (2 min): emite, genera la estrategia. **Comprobar**: «Nivel de gravedad», «¿De dónde sale cada recomendación?» (puntos) y la ruta en columnas.
3. **Líder** (2 min): cambia el rol; el Tablero trae la tabla con etiquetas y barra de avance, la cola a la derecha, «Proyectos por etapa» y «Madurez por proyecto» (simulados en gris con «ilustrativo»).
4. **Empresa** (1 min): cambia a Empresa: no hay «Resumen de la traza» ni gráficos técnicos.
5. **Anchos** (2 min): 768 (la columna lateral pasa arriba) y 320 (una columna, sin barra horizontal). Capturas en `docs/evidencia/h3-*.png`. Imprime el informe en blanco y negro: tablas abiertas y valores en texto.

**Pendiente tuyo**: T229 (esta revisión, `build && check` con tu lista de nombres y commit).

## Lote H3-fix — correcciones tras la revisión (lista corta, máx. 5 min)

1. Tablero a 1280: la tabla de equipos muestra la barra de avance con su porcentaje en cada fila y «Equipo N» en una línea; la cola de revisión tiene 3 tarjetas con «Revisar» a la derecha y, debajo, «Ver las 4 entregas por revisar» (lleva a Entregas). No hay desplazamiento dentro del recuadro.
2. Tablero, «Madurez por proyecto»: todas las barras empiezan y terminan en el mismo lugar; «ilustrativo» va bajo el nombre.
3. Revisión a 1280 y 1920: la columna de la derecha empieza a la altura de las cifras y «Aprobar y emitir» se ve sin bajar.
4. Diagnóstico: el Resumen de la traza tiene las barras a la izquierda y tres cifras con rótulo a la derecha; los nombres de herramienta no se parten. Los dos chips de arriba a la derecha están separados.
5. Estrategia: en la matriz «¿De dónde sale cada recomendación?» hay aire entre «Riesgo»/«Fase» y el título.
