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
