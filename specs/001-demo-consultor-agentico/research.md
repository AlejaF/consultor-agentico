# Investigación (Fase 0): DEMO navegable Consultor Agéntico

Fecha de las comprobaciones: 2026-11-01. Equipo: WSL, Node v26.13.0, npm 11.20.0. Todo lo que dice «verificado» se ejecutó aquí; lo que dice NO VERIFICADO no se pudo comprobar.

No quedaron marcadores `NEEDS CLARIFICATION`: las decisiones tecnológicas venían fijadas y no se encontró nada inviable.

## 1. Versiones y compatibilidad con Node v26.13.0

**Decisión**: fijar versiones exactas (sin `^`) de las que ya existen como `latest` en npm el 2026-11-01.

| Paquete | Versión | `engines.node` / pares (de `npm view`) | ¿Cumple con Node 26.13.0? |
|---|---|---|---|
| vite | 8.3.5 | `^20.19.0 \|\| >=22.12.0` | Sí |
| @vitejs/plugin-react | 6.1.2 | `^20.19.0 \|\| >=22.12.0`; par `vite ^8.0.0` | Sí |
| react / react-dom | 19.3.1 | par `react ^19.3.1` | Sí |
| typescript | 7.0.2 | `>=16.20.0` | Sí |
| vitest | 5.0.5 | `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`; par `vite ^6.4 \|\| ^7 \|\| ^8` | Sí |
| @playwright/test | 1.64.1 | `>=20` | Sí |
| @axe-core/playwright | 4.14.0 | `>=22.12.0` | Sí |
| @types/react, @types/react-dom | 19.3.0 | — | Sí |
| @types/node | 26.6.6 | — | Sí |
| @fontsource-variable/plus-jakarta-sans | 5.3.0 | licencia OFL-1.1 | Sí |

**Prueba de humo (verificado)**: en un proyecto desechable **fuera del repositorio** se instaló exactamente este conjunto y se ejecutó con Node v26.13.0:
- `tsc --version` → 7.0.2; `tsc --noEmit` → sin errores.
- `vite build` → compila (219,6 kB sin comprimir; 68,6 kB gzip con React 19 y un componente mínimo).
- `vitest run tests` → 1 prueba aprobada.
- `playwright test` con el Chromium ya instalado y `@axe-core/playwright` (etiquetas `wcag2a`, `wcag2aa`, `wcag22aa`) → 0 violaciones en una página mínima.

**Hallazgo**: `vitest run` sin restricción intenta cargar el `*.spec.ts` de Playwright y falla («Playwright Test did not expect test() to be called here»). Solución adoptada: separar `tests/unit/*.test.ts` (Vitest, con `include` acotado) de `tests/e2e/*.spec.ts` (Playwright, con `testMatch` acotado).

**Playwright y el navegador instalado (verificado)**: `~/.cache/ms-playwright/` contiene `chromium-1248`; el `browsers.json` de `playwright-core@1.64.1` pide la revisión `1248` (Chromium 156.0.8078.4). No hace falta descargar navegadores. Si se subiera la versión de Playwright, habría que reinstalar (`npx playwright install chromium`).

**Node en CI**: Node 24 (cumple los `engines` de todos los paquetes). NO VERIFICADO que sea la versión LTS vigente de `actions/setup-node`; si fallara, usar 22.

**Alternativas descartadas**: caret en las versiones (permite cambios al reinstalar), `jsdom` + Testing Library (más dependencias; las funciones puras no las necesitan), librería de rutas (ver §3).

## 2. Estado y persistencia

**Decisión**: contexto + reducer; persistir solo lo mutable (ver [data-model.md](./data-model.md)); `schemaVersion` entero; clave `consultor-agentico-demo:state`; ante cualquier discrepancia (versión distinta, JSON inválido, forma inválida) se descarta y se parte del estado inicial con aviso; si el almacenamiento falla (modo privado, cuota), se trabaja en memoria y se avisa (FR-007).

**Razones**: el estado inicial incluye ya proyectos precargados y entregas de ejemplo, así que «restablecer» es simplemente volver a ese estado; guardar solo deltas evita copias de contenido preparado que quedarían obsoletas al cambiar los datos estáticos. El almacenamiento se inyecta (interfaz mínima `getItem/setItem/removeItem`) para probar sin navegador.

**Archivos propios**: se lee `File.name`, `File.type`, `File.size`; **no se lee ni guarda el contenido** (FR-011/FR-012). Como el contenido nunca se lee, el aviso de privacidad es verdadero por construcción. La validación usa la extensión (el tipo MIME es poco fiable según el sistema operativo).

**Alternativas descartadas**: guardar el contenido (viola FR-006); IndexedDB (complejidad sin necesidad).

**Guardado inmediato**: además del retraso de 200 ms (que agrupa ráfagas de acciones), se hace flush en `pagehide` y en `visibilitychange` (cuando la página queda oculta) para no perder la última acción si la persona recarga o cierra de inmediato. Los oyentes y el temporizador se inyectan para probarlos con temporizadores simulados y un objetivo de eventos falso. NO VERIFICADO que todos los navegadores móviles los disparen en todos los cierres.

## 3. Rutas por hash

**Decisión**: enrutador propio (`useHashRoute`, `matchRoute`, `navigate`) con una tabla de rutas y una regla de acceso pura. Razones: ~14 rutas; GitHub Pages no reescribe rutas; evita añadir una dependencia; la regla de redirección única queda probada.
**Base**: `vite.config.ts` lee `BASE_PATH` (por defecto `/`); en CI vale `/<nombre-del-repo>/`. Como los enlaces internos usan solo `#/…`, la base solo afecta a los recursos estáticos.
**Alternativa descartada**: `react-router` con modo hash (funciona, pero añade una dependencia grande para esta necesidad). Se puede revisar si el enrutador propio se complica; NO VERIFICADO su costo real.

## 4. Paleta: extracción, tokens y contraste

**Método (verificado)**: los dos PDF contienen las pantallas como imágenes (5 y 7), sin texto vectorial (la fuente del de profesorado figura como `Glyphless`, capa de texto de reconocimiento; la del de estudiantes, `Helvetica`, de envoltorio). Se extrajeron las imágenes JPEG incrustadas y se muestrearon píxeles con el Chromium ya instalado (histograma cuantizado + muestras por región). Las muestras son aproximadas por la compresión JPEG; por eso se tratan como valores de partida, no como especificación.

**Valores observados (referencias)**:

| Elemento | Estudiantes | Profesorado |
|---|---|---|
| Fondo de página | `#f7f6fb` | blanco `#f8f8f8` (≈ `#ffffff`) |
| Superficie / tarjeta | `#ffffff`, borde `#e4e2ed` | blanco, borde `#cfced4` |
| Primario | `#5046e5` (botón, relleno de barras) | `#5454e8` (barra lateral, botones) |
| Activo de navegación | texto `#5243f4` sobre `#eeedfb` | texto `#5652fe` sobre blanco |
| Texto principal | `#0d0b19` | `#2a2a2a` |
| Texto secundario | `#5a5365` | `#2d2d2d` |
| Estado «en curso» | texto `#bf5500` sobre `#fdf3e7` | etiqueta `#e4eb61` |
| Estado «completo» | texto `#0e8c45`/`#078134` sobre `#e8f5ec` | etiqueta `#4cb978` |
| Peligro / riesgo alto | texto `#c11217` sobre `#fce8e7` | naranja `#e8683b` |
| Pendiente | texto `#5c5867` sobre `#f2f0fb` | gris `#f0f0f0` |
| Borde de entradas | — | `#88898b` |

**Decisión**: unificar en una sola familia de tokens (cuadro completo con contrastes en [contracts/design-tokens.md](./contracts/design-tokens.md)). Primario canónico `#5046e5` (de Estudiantes; blanco sobre él da 6,27:1, frente a 5,51:1 con `#5454e8`).

**Pares que NO cumplían AA y se ajustaron (anotado)**:

| Par de la referencia | Contraste | Ajuste | Resultado |
|---|---|---|---|
| `#bf5500` sobre `#fdf3e7` (en curso) | 4,24:1 | texto `#a34700` | 5,54:1 |
| `#0e8c45` sobre `#e8f5ec` (completado) | 3,85:1 | texto `#06702d` | 5,56:1 |
| `#078134` sobre `#e8f5ec` (aceptar) | 4,45:1 | texto `#06702d` | 5,56:1 |
| `#17ab4b` sobre `#f7f6fb` (trazabilidad) | 2,80:1 | texto `#06702d` | 5,81:1 |
| blanco sobre `#e8683b` (chip naranja) | 3,24:1 | texto `#0d0b19` | 6,00:1 |
| `#e8683b` sobre `#f0f0f0` (barra baja, no texto, mínimo 3:1) | 2,85:1 | relleno `#d04a20` | 3,87:1 sobre la pista `#efedf8` |

Bordes de tarjetas (1,28:1 y 1,56:1) son decorativos y no se usan como único indicador de un control; el borde de entradas usa `#88898b` (3,50:1 sobre blanco). Todo estado se comunica además con texto, no solo con color.

## 5. Tipografía

**Hallazgo (verificado)**: no se puede identificar la fuente de las referencias a partir de los archivos (sin fuente vectorial incrustada). A ojo, la familia del profesorado se parece a una sans geométrica tipo «Plus Jakarta Sans»; la de estudiantes, a una grotesca similar. **NO VERIFICADO.**
**Decisión**: una sola familia propia incluida en el repositorio, **Plus Jakarta Sans** (variable), con tipografía del sistema como respaldo, definida en el token `--font-sans`.
**Licencia (verificado)**: el paquete `@fontsource-variable/plus-jakarta-sans` 5.3.0 declara OFL-1.1 (permite uso y redistribución incluidos en el sitio). Se incluirá el texto de la licencia en `public/` o en el README. Tamaño del paquete: unos 146 kB sin empaquetar; el navegador solo descarga el subconjunto latino que usa (NO VERIFICADO el peso final en `dist/`).
**Alternativas descartadas**: fuentes desde CDN (prohibido por el plan); solo tipografía del sistema (viable como corte de tiempo).

## 6. Despliegue en GitHub Pages

**Fuentes leídas** (verificado): la página oficial «Using custom workflows with GitHub Pages», la de «Configuring a publishing source» y el workflow de ejemplo `pages/static.yml` de `actions/starter-workflows`.
**Requisitos (de las páginas oficiales)**: el job de despliegue necesita `pages: write` e `id-token: write`; usa el entorno `github-pages`; el paso de despliegue necesita un `id` para leer `page_url`; el artefacto no puede contener enlaces simbólicos; el origen se elige en Settings → Pages → Build and deployment → Source → **GitHub Actions**.
**Discrepancia entre fuentes oficiales**: el ejemplo usa `checkout@v4`, `configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v5`; la documentación, `checkout@v6`, `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`. Verificado con `git ls-remote` que existen también `checkout@v7`, `setup-node@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`.
**Decisión**: usar el conjunto de la documentación (`checkout@v6`, `setup-node@v6`, `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`; todas las etiquetas existen) y subir solo `dist/`. Que ese conjunto funcione unido queda **NO VERIFICADO** hasta la primera ejecución. Plan B en [plan.md](./plan.md) (riesgo R2).
**NO VERIFICADO**: qué planes de GitHub permiten Pages en repositorios privados (irrelevante: el repositorio será público); el contenido literal del archivo crudo `static.yml` (se leyó la vista renderizada).
**Estado local (verificado)**: el repositorio no tiene remoto configurado.

## 7. Pruebas y accesibilidad

- axe se ejecutará con `wcag2a`, `wcag2aa`, `wcag22aa`, a 320, 768 y 1280 px, en cada pantalla del lote. **NO VERIFICADO** que cubra todo WCAG 2.2 AA (automatiza una parte; la revisión manual de teclado queda para la persona).
- Objetivos táctiles: prueba en Playwright que recorre todos los controles visibles y comprueba ≥ 44 × 44 px (WCAG 2.2 pide 24 px como mínimo AA; la constitución exige 44).
- Nombres reales (`check-names`): compara sin distinguir mayúsculas ni tildes (se normaliza a descomposición Unicode, se quitan marcas diacríticas y se pasa a minúsculas) sobre `src/`, `index.html`, `README.md`, `docs/`, `dist/`, `specs/`, `.specify/` y `.claude/`. La lista (`.local/denylist.txt`) no puede publicarse, por lo que en CI la comprobación se omite con aviso y debe ejecutarse en local antes de cada push. Se añade `git ls-files referencias` (debe estar vacío) y la ausencia de PDF en `dist/`. `dist/` se revisa solo si existe (si no, avisa «dist/ no existe: ejecuta npm run build» y sigue); en CI el orden es `build` y luego `check`, y el paso previo a cada push de la persona es `npm run build && npm run check`. Limitación: solo revisa el árbol actual, no el historial de git.
- Red: prueba que registra todas las solicitudes y falla ante cualquiera a otro origen o con método distinto de `GET`.
- Impresión: emulación del medio `print` en Playwright y comprobación de texto de los rótulos; la impresión real a PDF queda para revisión humana.

## 8. Estimación de horas

Todas las cifras de [plan.md](./plan.md) §Lotes son **NO VERIFICADO**: no existe línea base de velocidad previa en este proyecto. Se calculó con una pantalla ≈ 0,3 a 0,5 h con su prueba, la lógica pura ≈ 0,15 a 0,25 h por módulo y un 20 % de colchón en los lotes con interacción compleja (revisión de hallazgos y rúbrica).
