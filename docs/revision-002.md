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

