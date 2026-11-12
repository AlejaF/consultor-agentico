# Listas de revisión corta de la especificación 002 «Agente real con IA»

Una lista por lote, de **máximo 10 minutos**, para la persona responsable. Cada lista dice qué comando correr, qué abrir y qué comprobar.
La escribe el agente al cerrar el lote; la revisión y el commit son de la persona (principio VIII). Los lotes C y D exigen además una
revisión a fondo (lectura del código y recorrido manual), que no cabe en estos 10 minutos.

## Lote A — Base y seguridad (revisión corta)

**Qué se hizo, en palabras simples**: se creó el «servicio local» (una carpeta `server/` que solo se enciende en tu computador y que
más adelante hablará con OpenAI), se puso un «vigilante de claves» (`check-secrets`) que hace fallar `npm run check` si alguna clave
se cuela en el repositorio o en la página publicada (`dist/`), y se dejó la configuración lista sin ningún modelo elegido.
**Todavía no hay IA**: el servicio solo contesta «estoy vivo» y la demo se ve exactamente igual que antes.

1. **Correr** (2 min): `npm run typecheck && npm test && npm run build && npm run check`.
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

1. **Correr** (2 min): `npm run typecheck && npm test && npm run build && npm run check`.
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
