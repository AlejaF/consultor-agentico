# Evidencia de seguridad del lote A (2026-11-11)

Prueba negativa del escáner de claves (`scripts/check-secrets.mjs`, tarea T014; AG-027, SC-A2, principio IX).
La clave usada fue **inventada** (`sk-proj-` seguida de 40 letras «A»), armada en la línea de comandos y **retirada
después de cada caso**. No se usó ninguna clave real ni se abrió `server/.env`.

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Repositorio limpio | pasa (código 0) | pasa: «OK (277 archivos revisados, dist/ incluido)» |
| Clave falsa añadida a un archivo versionado (`README.md`, línea 120) | falla (código 1) | falla; informa archivo, línea y regla, y solo los primeros 6 caracteres |
| Clave falsa en `dist/` | falla (código 1) | falla con la ruta de `dist/` |
| `server/.env` en la lista de archivos versionados | se marca | `forbiddenTracked` devuelve `server/.env` (prueba unitaria; no se hizo `git add`) |
| `server/.env.example` con un valor (`PORT=1234`) | falla | falla: «debe ir SIN valores» |
| Después de restaurar todo | pasa | pasa; `git diff README.md` sin cambios |

Otras comprobaciones: `git check-ignore` confirma que `server/.env` se ignora y `server/.env.example` no (el `.gitignore` tenía
`.env*`, que también ignoraba el ejemplo; se añadió `!.env.example`). `npm audit --prefix server`: 0 vulnerabilidades.

Límite honesto: los formatos de clave de OpenAI salen de fuentes de terceros (NO VERIFICADO en la documentación oficial del proveedor);
el escáner es una red de seguridad, no la única defensa (la clave solo vive en `server/.env`, ignorado por git).
