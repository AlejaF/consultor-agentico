# Implementation Plan: DEMO navegable Consultor Agéntico

**Branch**: `001-demo-consultor-agentico` (carpeta del spec; no hay extensión de git que cree ramas) | **Date**: 2026-11-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-demo-consultor-agentico/spec.md` (8 historias, FR-001 a FR-050, SC-001 a SC-015)

> Convención: toda cifra de tiempo es una **estimación NO VERIFICADO**. Todo lo que se comprobó en esta máquina el 2026-11-01 lo indica con «verificado» y su evidencia está en [research.md](./research.md).

## Summary

Una sola aplicación web de página única, 100 % estática (Vite + React + TypeScript), que une las interfaces de estudiantes y de profesorado con acceso por rol. El recorrido Evidencia → Diagnóstico → Estrategia se resuelve con **contenido preparado y ficticio** rotulado «Simulada»; las reglas que sí son reales dentro de la demo (revisión y emisión, derivación de la estrategia desde hallazgos aceptados, promedio de la rúbrica, validación de archivos, persistencia) viven en funciones puras con pruebas unitarias.

Enfoque técnico:
- **Navegación**: rutas por hash con un enrutador propio de unas 60 líneas (sin librería de rutas), con una única regla de redirección por rol.
- **Estado**: contexto + reducer. El estado persistido guarda **solo lo que la persona cambia** (rol, respuestas, archivos propios como nombre/tipo/tamaño, decisiones sobre hallazgos, estados de diagnóstico y estrategia, calificaciones, encuesta). Todo lo demás (empresas, equipos, evidencia de ejemplo, diagnóstico y estrategia preparados, rúbrica, encuesta) es dato estático tipado en `src/data/`.
- **Estrategia derivada, no copiada**: la estrategia se calcula con una función pura a partir de las decisiones; nunca se guarda un duplicado.
- **Diseño**: tokens CSS extraídos de las referencias, con relación de contraste documentada y ajustes anotados donde un par no cumplía AA.
- **Calidad**: Vitest para la lógica; Playwright + axe para accesibilidad y vistas a 320, 768 y 1280 px, más un recorrido P1 completo.
- **Despliegue**: GitHub Actions con las acciones oficiales de Pages; el repositorio público lo crea y publica la persona responsable (constitución VIII).

## Technical Context

**Language/Version**: TypeScript 7.0.2 (modo estricto) sobre Node v26.13.0 local y Node 24 en CI. Verificado: `tsc` 7.0.2 compila bajo Node 26.13.0.

**Primary Dependencies** (fijadas exactas; verificadas con `npm view` y con una instalación de prueba fuera del repositorio):

| Paquete | Versión | Tipo | Nota de compatibilidad con Node 26.13.0 |
|---|---|---|---|
| `react`, `react-dom` | 19.3.1 | runtime | sin restricción de Node |
| `@fontsource-variable/plus-jakarta-sans` | 5.3.0 | runtime (fuente propia, OFL-1.1) | sin restricción; ver decisión de tipografía |
| `vite` | 8.3.5 | desarrollo | exige `^20.19 \|\| >=22.12`: cumple |
| `@vitejs/plugin-react` | 6.1.2 | desarrollo | exige `^20.19 \|\| >=22.12`; par: `vite ^8`: cumple |
| `typescript` | 7.0.2 | desarrollo | `tsc` funciona (verificado) |
| `@types/react`, `@types/react-dom` | 19.3.0 | desarrollo | — |
| `@types/node` | 26.6.6 | desarrollo | para la configuración de Vite y Playwright |
| `vitest` | 5.0.5 | desarrollo | exige `^22.12 \|\| ^24 \|\| >=26`: cumple |
| `@playwright/test` | 1.64.1 | desarrollo | exige `>=20`: cumple |
| `@axe-core/playwright` | 4.14.0 | desarrollo | exige `>=22.12`: cumple |

Sin otras dependencias: no se usa librería de rutas, de estado, de componentes, de formularios, de íconos ni de gráficos; tampoco `jsdom` ni Testing Library (las pruebas unitarias usan funciones puras y un almacenamiento simulado inyectable).

**No hubo incompatibilidades con Node v26.13.0**: en una instalación de prueba con este conjunto exacto, `tsc --noEmit`, `vite build`, `vitest run` y Playwright con axe (0 violaciones sobre una página mínima) pasaron. Dos hallazgos que condicionan la configuración (no son incompatibilidades): (1) Vitest recoge por defecto los `*.spec.ts` de Playwright y falla, por lo que se restringe `include` a `tests/unit/**/*.test.ts`; (2) CI usa Node 24 y no 26, porque 26 no es una versión de soporte prolongado (NO VERIFICADO que `actions/setup-node` ofrezca 26 como `lts`; Node 24 cumple los `engines` de todos los paquetes).

**Storage**: almacenamiento local del navegador (clave `consultor-agentico-demo:state`), con `schemaVersion` y migración a estado inicial si no coincide; guardado con retraso de 200 ms **más guardado inmediato (flush)** en los eventos `pagehide` y `visibilitychange`; sin servidor ni base de datos ni claves. De los archivos propios solo se guardan nombre, tipo y tamaño (FR-006, FR-012).

**Testing**: Vitest 5.0.5 (lógica) y Playwright 1.64.1 + axe (accesibilidad, responsive, recorrido P1). Verificado: el Chromium de Playwright ya instalado (revisión 1248) es el que pide `@playwright/test` 1.64.1 (`browsers.json`: 1248), por lo que no hace falta descargar navegadores.

**Target Platform**: navegadores modernos de escritorio, tableta y celular; publicado como sitio estático en GitHub Pages (repositorio público).

**Project Type**: aplicación web de página única, solo cliente.

**Performance Goals**: carga inicial inmediata en conexión doméstica; la «generación» simulada dura 1,5 s fijos con indicador (solo para que se vea el rótulo «Simulada»); paquete JavaScript de menos de 150 kB comprimidos (meta NO VERIFICADO; la prueba mínima ya pesa 68,6 kB).

**Constraints**: sin CDN ni scripts/fuentes externos; sin solicitudes de red con datos de la persona (SC-003); objetivos táctiles ≥ 44 px; WCAG 2.2 AA; funcionar si el almacenamiento no está disponible.

**Scale/Scope**: unas 14 pantallas, 3 roles, 4 proyectos del Consultor + 3 equipos adicionales para el Líder, 8 hallazgos preparados por diagnóstico.

## Constitution Check

*GATE: Debe pasar antes de la investigación (Fase 0). Se reevaluó tras el diseño (Fase 1): sin cambios.*

| Principio | Cómo lo cumple el plan | Estado |
|---|---|---|
| **I. Datos ficticios y rotulados** | Todos los datos viven en `src/data/` con nombres inventados («Empresa Ficticia …»); emblema genérico propio. `referencias/` está en `.gitignore`. Verificación automática (`npm run check`): (a) `scripts/check-names.mjs` busca una lista de nombres reales que **no se commitea** (`.local/denylist.txt`, también ignorada) en `src/`, `index.html`, `README.md`, `docs/`, `dist/`, `specs/`, `.specify/` y `.claude/`, **sin distinguir mayúsculas ni tildes**; sin la lista, **en local falla** con instrucciones claras (cómo crearla) y **en integración continua (variable `CI`) avisa que omite solo esa comprobación** y sigue con las demás; (b) `git ls-files referencias` debe estar vacío (falla si `referencias/` está versionada); (c) `dist/` no puede contener PDF; **`dist/` se revisa solo si existe** (si no, avisa «dist/ no existe: ejecuta npm run build» y sigue). El paso previo a cada push de la persona es **`npm run build && npm run check`** con la lista de nombres presente. | Cumple |
| **II. Solo sitio estático** | Sin servidor, base de datos ni claves; la «IA» es contenido preparado con rótulo «Simulada». La generación solo espera 1,5 s. Sin CDN. | Cumple |
| **III. Honestidad** | Componentes `SimBadge` y `UnverifiedBadge` obligatorios en toda vista con contenido simulado; sector y mercado llevan «NO VERIFICADO · contenido ilustrativo»; meta 4,2 rotulada «ilustrativa»; las metas de tiempo de este plan están marcadas NO VERIFICADO; la prueba de «0 solicitudes con datos de la persona» es automática. | Cumple |
| **IV. Responsive y accesible** | Diseño de una columna primero; tablas que se reorganizan por debajo de 640 px; `min-height/width: 44px` en todo control; elementos nativos (`button`, `a`, `dialog`, `select`, `input type=file`); foco visible; enlace «Saltar al contenido»; regiones `aria-live`. Verificación: axe + 3 anchos + prueba solo con teclado. | Cumple |
| **V. Diseño como tokens** | Un único `src/styles/tokens.css`; los componentes solo usan `var(--…)`; una verificación (`check-tokens`) falla si hay colores hexadecimales fuera de ese archivo. Contrastes documentados en [contracts/design-tokens.md](./contracts/design-tokens.md). | Cumple |
| **VI. Especificación primero** | Este plan nace del spec vigente; cada tarea citará FR/historia; los cambios de comportamiento durante la implementación vuelven al spec. | Cumple |
| **VII. Alcance acotado** | Lotes ordenados por prioridad con línea de corte explícita (P3 se corta primero; dentro de P3, primero Contacto, último informe). Sin casos de uso ni conversación. | Cumple |
| **VIII. Revisión por lote** | 6 lotes, cada uno termina con pruebas, revisión humana y commit **de la persona**; el agente no hace commit ni push. Crear el repositorio, el remoto y activar Pages también son acciones de la persona. | Cumple |

Sin violaciones; la tabla «Complexity Tracking» no aplica.

**Decisiones de alcance técnico que merecen que las conozcas** (todas dentro de lo que pediste o de menor complejidad):
1. **Enrutador propio en vez de librería de rutas**: hay ~14 rutas y una regla de acceso; evita una dependencia grande. Costo: unas 60 líneas con pruebas unitarias.
2. **CI ejecuta tipos, pruebas unitarias y compilación; Playwright se ejecuta en la máquina local**, no en CI, para no añadir instalación de navegador a la tubería ni riesgo de fallo cerca de la entrega. Se puede añadir después.
3. **Tipografía**: una sola familia propia (Plus Jakarta Sans, OFL-1.1) con tipografía del sistema como respaldo. **No se pudo comprobar que sea la fuente de las referencias** (ver [research.md](./research.md) §Tipografía): NO VERIFICADO. Si el tiempo apremia, se corta y quedan las fuentes del sistema.

## Project Structure

### Documentation (this feature)

```text
specs/001-demo-consultor-agentico/
├── spec.md
├── plan.md                         # Este archivo
├── research.md                     # Fase 0: decisiones, versiones verificadas, paleta, tipografía, despliegue
├── data-model.md                   # Fase 1: entidades, reglas, transiciones, estado persistido
├── quickstart.md                   # Fase 1: cómo ejecutar y validar de punta a punta
├── contracts/
│   ├── routes.md                   # Mapa de rutas por rol y regla de redirección
│   ├── persisted-state.md          # Esquema persistido, versión y migración
│   └── design-tokens.md            # Tokens, contrastes y ajustes
├── checklists/requirements.md
└── tasks.md                        # Lo crea /speckit-tasks (no este comando)
```

### Source Code (repository root)

```text
├── index.html
├── package.json                    # versiones exactas; scripts: dev, build, typecheck, test, test:e2e, check
├── package-lock.json
├── vite.config.ts                  # base desde BASE_PATH (por defecto '/'); include de Vitest acotado
├── playwright.config.ts            # webServer sobre `vite preview`; proyectos 320, 768, 1280
├── tsconfig.json
├── .gitignore                      # + .local/, test-results/, playwright-report/
├── .github/workflows/deploy.yml
├── docs/decisiones.md              # registro de decisiones corto
├── README.md                       # honesto: qué es simulado, cómo ejecutar, despliegue, uso de Spec Kit
├── scripts/
│   ├── check-names.mjs             # nombres reales (lista local, sin mayúsculas/tildes), referencias/ no versionada, PDF en dist
│   ├── lib/names.mjs               # normalización y búsqueda (con pruebas unitarias; tsconfig con allowJs)
│   └── check-tokens.mjs            # sin colores fuera de tokens.css
├── public/                         # emblema genérico (SVG propio), favicon
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx                 # rutas → pantallas
│   │   ├── router.ts               # useHashRoute, navigate, matchRoute
│   │   ├── access.ts               # regla de redirección por rol (pura)
│   │   └── AppShell.tsx            # cabecera, aviso de demo, selector de rol, navegación, saltar al contenido
│   ├── state/
│   │   ├── types.ts                # tipos del estado persistido
│   │   ├── reducer.ts              # acciones puras
│   │   ├── context.tsx             # proveedor + hook + guardado
│   │   └── persistence.ts          # load/save/migrate/flush con almacenamiento inyectable; attachFlush(pagehide, visibilitychange)
│   ├── domain/                     # funciones puras (todas con pruebas)
│   │   ├── fileValidation.ts       # FR-010
│   │   ├── review.ts               # FR-019 a FR-021
│   │   ├── strategy.ts             # FR-025: derivación
│   │   ├── rubric.ts               # FR-030/031: promedio y formato 1,0
│   │   ├── progress.ts             # avance de proyecto y de captura
│   │   └── format.ts               # fechas y números con coma decimal
│   ├── data/                       # TODO ficticio y tipado
│   │   ├── companies.ts, teams.ts, projects.ts
│   │   ├── evidence.ts             # evidencia de ejemplo y extractos
│   │   ├── diagnosis.ts            # hallazgos preparados con citas
│   │   ├── strategy.ts             # riesgos, ruta, sector/mercado (NO VERIFICADO)
│   │   ├── rubric.ts, survey.ts, questions.ts
│   │   └── accounts.ts
│   ├── components/                 # ver «Componentes principales»
│   ├── screens/
│   │   ├── Login.tsx
│   │   ├── consultor/{Projects,Evidence,Diagnosis,Review,Strategy,Report}.tsx
│   │   ├── lider/{Dashboard,DeliveryReview,Report}.tsx
│   │   └── contacto/{Summary,Survey}.tsx
│   └── styles/{tokens.css,base.css,layout.css,print.css}
└── tests/
    ├── unit/*.test.ts              # Vitest (include acotado a esta carpeta)
    └── e2e/*.spec.ts               # Playwright + axe
```

**Structure Decision**: un único proyecto de interfaz, sin backend. Las reglas de negocio de la demo están separadas en `src/domain/` (puras, probables sin navegador) y los datos ficticios en `src/data/` (un solo lugar para auditarlos contra el principio I).

## Modelo de datos y estado persistido

Detalle completo en [data-model.md](./data-model.md) y [contracts/persisted-state.md](./contracts/persisted-state.md). Resumen:

- **Estático** (no se persiste): cuentas, empresas, equipos, proyectos y su estado inicial, **UNA plantilla de diagnóstico** (8 hallazgos, 6 dimensiones, 1 con respaldo insuficiente) y **UNA plantilla de estrategia** (riesgos, ruta, sector/mercado) **compartidas por todos los proyectos**, **5 elementos de evidencia por ranura (1 a 5)** con sus extractos, de modo que las citas resuelven en cualquier proyecto; rúbrica (4 criterios, niveles 1–5), encuesta, preguntas de captura. Los equipos adicionales del Líder reutilizan las mismas plantillas con otros nombres ficticios de empresa. Cada hallazgo gana un campo `plainText` (texto no técnico para el Contacto, FR-035) **en L5b, no en L3**.
- **Persistido** (`PersistedState`, `schemaVersion: 2`): `session.role`; por proyecto: `answers`, `localFiles[]` (`id`, `name`, `type`, `size`, `addedAt`), `diagnosis` (`status`, `generatedAt`, `issuedAt`, decisión por hallazgo con texto editado), `strategy` (`status`, `sentAt`); `gradings` por entrega (clave `dx/<projectId>` o `st/<projectId>`); `surveys`; `activity[]`.
- **Derivado en ejecución**: entregas (el diagnóstico emitido y la estrategia enviada, más las precargadas de otros equipos), estrategia (de las decisiones), avance, contadores, promedio.
- **Migración**: si `schemaVersion` difiere, el JSON está dañado o la forma no valida, se descarta y se usa el estado inicial, con un aviso «Se restableció la demo (versión de datos distinta)». Si el almacenamiento falla, se trabaja en memoria con aviso (FR-007).

## Mapa de rutas por rol y regla de redirección

Detalle en [contracts/routes.md](./contracts/routes.md). Rutas por hash (`#/…`), sin recargas ni reescritura de servidor.

| Ruta | Rol | Pantalla | Historia |
|---|---|---|---|
| `#/` | cualquiera | Ingreso por rol (3 cuentas ficticias) | US1 |
| `#/consultor` | Consultor | Lista de proyectos | US1 |
| `#/consultor/proyectos/:projectId/evidencia` | Consultor | Captura de evidencia | US2 |
| `#/consultor/proyectos/:projectId/diagnostico` | Consultor | Reporte generado | US3 |
| `#/consultor/proyectos/:projectId/revision` | Consultor | Panel de revisión y emisión | US4 |
| `#/consultor/proyectos/:projectId/estrategia` | Consultor | Estrategia: bloqueada sin diagnóstico emitido; con él, botón «Generar estrategia» (1,5 s, «Simulada») | US5 |
| `#/consultor/proyectos/:projectId/informe` | Consultor | Informe imprimible | US8 |
| `#/lider` | Líder | Tablero | US6 |
| `#/lider/entregas` | Líder | Entregas por revisar (lista; destino de la navegación) | US6 |
| `#/lider/entregas/:tipo/:projectId` (`tipo` = `dx` o `st`) | Líder | Revisión y calificación | US6 |
| `#/lider/entregas/:tipo/:projectId/informe` | Líder | Informe imprimible de la entrega (`dx`: solo diagnóstico; `st`: estrategia enviada con su diagnóstico) | US8 |
| `#/contacto` | Empresa | Hoy: mensaje «Vista no disponible»; el resumen del proyecto es la historia 7 (pendiente de decisión al cerrar L6) | US7 |
| `#/contacto/encuesta` | Contacto | Encuesta simulada | US7 |

**Regla de redirección (única, en `access.ts`, función pura probada)**:
1. Sin rol activo y ruta ≠ `#/` → `#/` (sin mensaje).
2. Rol activo y ruta de otro rol → inicio del rol activo con el aviso «Esa vista pertenece al rol X. Estás como Y.» (FR-003).
3. Ruta desconocida, `:projectId` inexistente, `:tipo` distinto de `dx`/`st`, o entrega que aún no existe (sin diagnóstico emitido o sin estrategia enviada) → inicio del rol activo con aviso.
4. `#/` con rol activo → inicio del rol activo (el cambio de rol se hace con el selector, que conserva todo el estado, FR-002).
5. Bloqueos por orden de flujo (estrategia o informe sin diagnóstico emitido) **no redirigen**: muestran la pantalla con el bloqueo explicado y un enlace (FR-023, historia 8).
Al cambiar de ruta, el foco pasa al encabezado principal, se actualiza el título de la página y se anuncia el cambio. Este control es solo de experiencia y no protege datos (rotulado en el ingreso).

## Componentes principales

`SideNav` (navegación por rol, pasos del flujo del proyecto y sin pie de cuenta; FR-049; la Empresa no muestra navegación mientras su vista no exista); `AppShell` (cabecera, `DemoBanner`, `RoleSwitcher`, navegación lateral que bajo 1024 px pasa a una barra de pestañas siempre visible (sin menú ni «Opciones»; la cabecera lleva «Inicio» y «Restablecer demo»), «Saltar al contenido», región `aria-live` de avisos); `SimBadge` («Simulada»); `UnverifiedBadge` («NO VERIFICADO»); `Notice`; `ConfirmDialog` (`<dialog>` nativo); `ProgressBar`; `StatusBadge` (estado con texto, no solo color); `ResponsiveTable` (tabla que se reorganiza); `ProjectCard`; `FileDropzone` (arrastrar + botón de selección con teclado); `EvidenceList`; `CaptureProgress`; `QuestionForm`; `GenerateButton` (con bloqueo y simulación de 1,5 s; se reutiliza para «Generar estrategia»); `FindingCard` (aceptar/editar/rechazar con edición en línea); `CitationButton` + `EvidencePanel` (extracto ficticio; debajo del hallazgo en celular); `ReviewSummary` (N de M, emitir); `StrategyView` (`RiskCard`, `RouteTimeline`, `DerivedFrom`); `KpiCard`; `TeamsTable`; `ReviewQueue`; `RubricForm` (grupos de radio con nivel 1–5, rótulo «Criterios de ejemplo…», promedio y meta); `GradeSummary`; `SurveyForm`; `PrintReport` (compartido por Consultor y Líder; estilos de impresión).

## Estrategia de pruebas por prioridad

| Prioridad | Vitest (lógica) | Playwright + axe |
|---|---|---|
| **P1** | `fileValidation` (formatos, vacío, tamaño, duplicado, nombre largo, lote mixto); `review` (revisión completa, al menos un aceptado, edición vacía, solo-rechazados, hallazgo NO VERIFICADO aceptable); `persistence` (guardar/cargar, versión distinta, JSON dañado, almacenamiento no disponible, solo nombre/tipo/tamaño) **y `flush`** (un cambio seguido de flush escribe de inmediato y cancela el temporizador sin doble escritura; flush sin cambios no escribe; ráfagas dentro de 200 ms se agrupan; flush con almacenamiento que falla pasa a modo memoria; `attachFlush` reacciona a `pagehide` y a `visibilitychange` solo cuando la página queda oculta); `access` (las 5 reglas de redirección, incluidas las rutas `:tipo/:projectId`) | **Recorrido P1 completo** (ingreso → cargar archivo válido y no válido → generar → revisar con aceptar/editar/rechazar → emitir → **recargar inmediatamente después de la última acción, sin esperar los 200 ms**, y comprobar que la decisión, el estado «Emitido» y el archivo siguen, con la nota «Contenido no conservado en esta demo»); proyecto sin evidencia (bloqueo); en P-D, tras cargar un archivo, toda cita muestra «Evidencia de ejemplo (ficticia)»; axe en las 6 pantallas P1 a 320, 768 y 1280 px; navegación solo con teclado (carga, revisión); prueba de red: 0 solicitudes con datos y 0 a otros orígenes |
| **P2** | `strategy` (deriva solo de aceptados/editados **verificados**; un hallazgo aceptado pero NO VERIFICADO no cuenta como respaldo ni aparece en «Deriva de»; un elemento sin respaldo no se muestra; estrategia vacía con aviso; «Generar estrategia» solo con diagnóstico emitido e idempotente); `rubric` (promedio, redondeo a 1 decimal con coma, validación de 4 criterios + comentario) | Estrategia bloqueada/«Generar estrategia»/generada; Líder: calificar con «Guardar calificación», ver la calificación como Consultor, la emisión sigue intacta; axe y 3 anchos del tablero y la calificación |
| **P3** | derivación del informe (excluidos contados, sin calificación, nota de estrategia no disponible; **por tipo de entrega: `dx` solo diagnóstico, `st` estrategia enviada con su diagnóstico, nunca una estrategia generada pero no enviada**); `plainText` no vacío en todos los hallazgos (se crea en L5b); encuesta (obligatorias) | Informe: vista de impresión (emulación de medio `print`), rótulos presentes; Contacto: resumen y encuesta; axe |
| **Transversal** | `check-names` (normalización sin mayúsculas ni tildes, ausencia de la lista en local y en CI), `check-tokens`, `format` (coma decimal, 1,0 a 5,0) | Cambio de rol a mitad de flujo; 320 px sin desplazamiento horizontal en todas las pantallas; objetivos táctiles ≥ 44 px (comprobación por consulta del tamaño de todos los controles) |

Regla: un lote no se cierra con pruebas de su prioridad en rojo. axe se ejecuta con las etiquetas `wcag2a`, `wcag2aa` y `wcag22aa`; la revisión manual de teclado y lector queda para la persona (NO VERIFICADO que axe cubra todo AA: automatiza una parte).

## Plan de despliegue

Detalle y razones en [research.md](./research.md) §Despliegue. Flujo único `.github/workflows/deploy.yml`:

1. Disparadores: `push` a `main` y `workflow_dispatch`.
2. Permisos: `contents: read`, `pages: write`, `id-token: write`; `concurrency: { group: pages, cancel-in-progress: false }`.
3. Job `build`: `actions/checkout@v6`, `actions/setup-node@v6` (Node 24, caché de npm), `npm ci`, `npm run typecheck`, `npm test`, **`npm run build`** con `BASE_PATH=/${{ github.event.repository.name }}/` **y después `npm run check`** (así `check` ve `dist/`; en CI sin la lista de nombres avisa y omite solo esa comprobación), `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4` con `path: dist`.
4. Job `deploy` (`needs: build`): `environment: github-pages`, `actions/deploy-pages@v4` con `id: deployment`.

Versiones: tomadas de la página oficial «Using custom workflows with GitHub Pages»; verificado con `git ls-remote` que existen esas etiquetas y que hay versiones más nuevas (checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5). **Las fuentes oficiales no coinciden entre sí** (el workflow de ejemplo usa checkout v4, upload v3, deploy v5; la documentación, checkout v6, upload v4, deploy v4). Se elige el conjunto de la documentación y se anota el alternativo en los riesgos. Que el conjunto funcione juntos queda NO VERIFICADO hasta la primera ejecución real.

**Acciones de la persona responsable** (fuera de las horas del agente): el repositorio **público ya existe y ya se subieron los documentos**. Tras el andamiaje y el workflow de L1, hacer un commit parcial, el push, activar Settings → Pages → «Source: GitHub Actions» y comprobar el primer despliegue (así un fallo de Actions, R2, aparece al inicio y no al final). Antes de cada push: **`npm run build && npm run check` en local con la lista de nombres presente** (en CI esa comprobación se omite con aviso, porque la lista no puede estar en un repositorio público), y confirmar que `referencias/` no está en el historial.

## Riesgos

| # | Riesgo | Prob. | Mitigación / plan B |
|---|---|---|---|
| R1 | Falta de tiempo (12 h para publicar; 9,5 h de trabajo del agente NO VERIFICADO + 15 min de revisión humana por lote, 30 min en L1 y L6) | Alta | **Puntos de control** de horas acumuladas (abajo): si se supera uno, P3 se corta sin discusión; primer despliegue al inicio de L1; no empezar un lote sin cerrar el anterior; el margen restante cubre solo imprevistos |
| R2 | Las acciones oficiales de Pages no coinciden entre fuentes o cambia un paso | Media | Primer despliegue temprano (Lote 1) con una página mínima; plan B: conjunto del workflow de ejemplo (checkout v4, configure v5, upload v3, deploy v5) o el más reciente |
| R3 | La base `/<repo>/` rompe recursos | Media | `BASE_PATH` en CI; se prueba con `vite preview --base` en local; enlaces solo con hash |
| R4 | TypeScript 7.0.2 es nueva y alguna herramienta no la reconoce | Baja | Verificado en prueba mínima; plan B: fijar la última 5.x/6.x (solo se usa para `tsc --noEmit`) |
| R5 | axe no detecta todo AA; contrastes en estados de foco/hover | Media | Tokens con contraste calculado; revisión manual con teclado en el Lote 6; marcar lo no comprobado |
| R6 | Fuente propia no coincide con la de las referencias | Alta | Es NO VERIFICADO y está en un solo token; respaldo con fuentes del sistema; el registro de decisiones lo declara |
| R7 | Datos reales se cuelan (nombres de las referencias en textos) | Media | `check-names` con lista local sobre `src/`, `index.html`, `README.md`, `docs/`, `dist/`, `specs/`, `.specify/` y `.claude/`, sin mayúsculas ni tildes; en CI se omite con aviso (la lista no se publica), por eso **se ejecuta en local antes de cada push**; revisión humana por lote |
| R8 | Almacenamiento no disponible o corrupto (modo privado) | Media | Modo memoria con aviso; migración a estado inicial; probado con almacenamiento simulado |
| R9 | Vitest recoge pruebas de Playwright y falla (observado) | Cierta | `include: ['tests/unit/**/*.test.ts']` desde el Lote 1 |
| R10 | Los tres roles comparten navegador y la persona se confunde | Media | Rótulo permanente del rol activo, selector visible y la nota «Quién hace qué» en el ingreso |
| R11 | Fidelidad visual con las referencias (solo existen como imágenes) | Media | Se toman tokens y estructura, no píxeles; las capturas se contrastan a ojo en la revisión del lote |
| R12 | La edición de hallazgos y el panel de evidencia son lo más complejo de la interfaz | Media | Edición en línea con `textarea` nativo; el panel de evidencia es una región que cambia de sitio por CSS |
| R13 | El Lote 1 se alarga (es el cimiento y arrastra el despliegue) | Media | **Regla de corte: si el tiempo del agente en el Lote 1 (solo las tareas que no son de la persona) supera 2,5 h, se recorta P3 de inmediato** (se eliminan 5b y 5a del plan, quedando 8,0 h para lo demás) sin esperar a llegar al Lote 5. Las tareas deben registrar la hora al cierre del Lote 1 |
| R14 | `pagehide` / `visibilitychange` no garantizan siempre el guardado (cierres forzados, fallos del navegador) | Baja | Retraso de solo 200 ms además del flush; prueba de recarga inmediata en Playwright; NO VERIFICADO el comportamiento en todos los navegadores móviles |
| R15 | No se consiguen 2 o 3 participantes para las pruebas con usuarios | Media | Convocarlos en la sesión 1 (T022); si no hay, SC-001 y SC-005 quedan NO VERIFICADO (no se inventan resultados); con 2 o 3 personas SC-005 solo puede quedar «indicativo (n = …)» |

## Lotes (6) y línea de corte

Estimaciones **NO VERIFICADO**. Incluyen sus pruebas. Tras el análisis de consistencia, el Lote 6 pasa de 0,75 h a 1,25 h. Suma: **9,5 h de trabajo del agente**. Las revisiones humanas (15 min por lote; 30 min en L1 y en L6) y, en L6, la prueba con usuarios y el pulido **no** están en esas horas: se cuentan en los «Puntos de control» (abajo) y el margen que queda de las 12 h cubre **solo imprevistos**.

| Lote | Contenido | Historias / FR | Prioridad | Horas | Criterio de salida |
|---|---|---|---|---|---|
| **1. Base y primer despliegue** | Proyecto Vite/React/TS con versiones fijas; tokens y estilos base; enrutador por hash y regla de acceso; estado, reducer, persistencia con migración y **flush en `pagehide`/`visibilitychange`**; AppShell (aviso de demo, selector de rol, navegación responsive, saltar al contenido, avisos); ingreso por rol; datos de cuentas, empresas, equipos y proyectos; scripts `check` (**nombres con comportamiento local/CI, `referencias/` no versionada, PDF en `dist/`**); workflow de Pages | US1; FR-001 a 007, 037 a 043 | P1 | **1,95** | Pruebas de `access`, `persistence` y `flush` en verde; `check-names` probado con y sin lista; axe sin violaciones en el ingreso a 3 anchos; `npm run build` con base de subruta correcta; **primer despliegue de una página mínima justo después del andamiaje y del workflow** (lo hace la persona) y despliegue del lote al cierre. **Si el tiempo del agente en L1 pasa de 2,5 h, se recorta P3** (R13) |
| **2. Evidencia** | Lista de proyectos del Consultor; captura de evidencia (preguntas, listas, progreso); `FileDropzone` con validación; aviso de privacidad; nota «Contenido no conservado en esta demo»; evidencia de ejemplo y proyecto sin evidencia | US2; FR-008 a 014 | P1 | **1,25** | Pruebas de `fileValidation` y de persistencia de metadatos en verde; carga válida/no válida con teclado; prueba de red sin solicitudes |
| **3. Diagnóstico y revisión** | **Plantilla única** de diagnóstico (8 hallazgos) y las 5 ranuras de evidencia con extractos; generar (simulado, bloqueo sin evidencia); reporte con citas abribles y rotuladas «Evidencia de ejemplo (ficticia)»; panel de revisión (aceptar/editar/rechazar, avance, emisión); entrega creada al emitir; solo lectura | US3, US4; FR-015 a 022 | P1 | **1,9** | Pruebas de `review` en verde; **recorrido P1 completo en Playwright** (con recarga inmediata); axe en pantallas P1 a 320/768/1280. **Cierra todo P1** |
| **4. Estrategia y Líder** | **Plantilla única** de estrategia; estrategia derivada (función pura) con trazabilidad y rótulos; bloqueo sin diagnóstico emitido; botón «Generar estrategia» (1,5 s, «Simulada») y «Enviar a revisión»; tablero del Líder con equipos adicionales que reutilizan las plantillas con otros nombres ficticios, cola; revisión de entrega en `#/lider/entregas/:tipo/:projectId`; rúbrica 1–5 con «Guardar calificación»; calificación visible para el Consultor | US5, US6; FR-023 a 033 | P2 | **1,65** | Pruebas de `strategy` y `rubric` en verde; Playwright de estrategia, calificación y vuelta al Consultor; la emisión no cambia; axe y 3 anchos |
| **5. P3** (pendiente de decisión al cerrar L6) | **5a** informe imprimible (compartido por Consultor y Líder, estilos de impresión) y **5b** vista del Contacto con encuesta simulada y el campo `plainText` de la plantilla de diagnóstico (con su prueba) | US8 (5a), US7 (5b); FR-034 a 036, 044 a 048 | P3 | **1,5** (5a 0,75 + 5b 0,75) | Playwright con medio `print` y rótulos; encuesta con obligatorias; axe |
| **6. Cierre** | Pasada transversal de accesibilidad, teclado, 320 px y objetivos de 44 px; README honesto y `docs/decisiones.md`; evidencia de axe y de las vistas responsive guardada en `docs/`; guion de pruebas con usuarios (`docs/evidencia/pruebas-usuarios.md`), prueba con 2 o 3 personas y pasada de pulido (tareas de la persona); decisión sobre P3; verificación de nombres y de PDF; revisión de los SC medibles; despliegue final | transversal; SC-003, 004, 007 a 010 | P1/P2 | **1,25** | `typecheck`, `test`, `build`, `check` y `test:e2e` en verde; README completo; publicación verificada por la persona |
| | | | **Total** | **9,5** | |

### Línea de corte por prioridad (qué se corta primero)

**La decisión sobre P3 se toma al cerrar L6** (no antes); si se decide no hacerlo, o si algún punto de control anterior se superó, se corta en este orden, de lo primero a lo último:
1. **Lote 5b: vista del Contacto y encuesta (P3)**: −0,75 h → quedan 8,75 h.
2. **Lote 5a: informe imprimible (P3)**: −0,75 h → quedan 8,0 h.
3. Lo anterior elimina todo P3; **no se corta nada de P1 ni de P2** (el spec lo exige completo para validar el flujo). Si aún faltara tiempo, se reduce primero el pulido visual (tipografía propia → fuentes del sistema, −0,25 h) y no las pruebas P1 ni la accesibilidad.
4. Los Lotes 1 a 4 y el Lote 6 son la línea mínima: **8,0 h** de trabajo del agente.

Cuando se recorte, el README y el spec dicen explícitamente «no incluido en esta versión» (principio VII) y se retiran las rutas, los enlaces y los criterios afectados.

### Puntos de control (horas ACUMULADAS desde el inicio de L1)

Incluyen el trabajo del agente de cada lote más **15 min de revisión humana por lote (30 min en L1 y en L6)** y, en L6, la **prueba con usuarios, la comprobación manual de teclado y lector y la pasada de pulido** (tareas de la persona). El margen que queda de las 12 h cubre **solo imprevistos**. Todas las cifras son **NO VERIFICADO**.

| Punto | Cálculo nominal | Acumulado nominal | Límite |
|---|---|---|---|
| Cierre de L1 | 1,95 + 0,50 | 2,45 h | **≤ 3,0 h** |
| Cierre de L2 | + 1,25 + 0,25 | 3,95 h | — |
| Cierre de L3 (cierra P1) | + 1,90 + 0,25 | 6,10 h | **≤ 7,0 h** |
| Cierre de L4 (cierra P2) | + 1,65 + 0,25 | 8,00 h | **≤ 9,0 h** |
| Cierre de L6 (agente y revisión final) | + 1,25 + 0,50 | 9,75 h | — |
| Pruebas con usuarios, comprobación manual y pulido (persona) | + 1,50 *(estimación, NO VERIFICADO)* | 11,25 h | **Aquí se decide P3** |
| Cierre de L5a (si se hace) | + 0,75 + 0,25 | 12,25 h | solo si el cierre de L6 con pruebas y pulido ≤ 10,5 h *(derivado, ajustable)* |
| Cierre de L5b (si se hace) | + 0,75 + 0,25 | 13,25 h | solo si el cierre de L5a ≤ 10,5 h *(derivado, ajustable)* |

- **La decisión sobre P3 se toma al cerrar L6** (con las horas reales y los resultados de las pruebas con usuarios), no al cerrar L4. Los puntos de control de L1, L3 y L4 la anticipan: **si alguno se superó, la decisión ya es «no» y P3 se corta sin discusión.**
- Los límites de L1, L3 y L4 son decisión del responsable; los de L5a y L5b (y la estimación de 1,5 h de pruebas con usuarios, comprobación manual y pulido) los derivé yo y se pueden ajustar: cada lote de P3 solo se empieza si puede terminar con al menos 0,5 h de margen (≤ 11,5 h).
- **R13** cuenta solo el tiempo del agente en L1, sin las tareas de la persona.
- A ritmo nominal, sin P3 el plan cierra en **11,25 h** (0,75 h de margen). L5a solo cabe si se va al menos 0,75 h adelantado y L5b solo si se va al menos 1,75 h adelantado. Con todo P3 y a ritmo nominal el total sería 13,25 h, que **no cabe** en las 12 h. Con 2 o 3 participantes, **SC-005 solo puede quedar «indicativo (n = …)»**.

### Sesiones de trabajo y orden de ejecución

- **Sesión 1**: L1, L2 y L3. Cierra todo P1, con push y despliegue verificado. En esta sesión la persona también **convoca a 2 o 3 participantes** para las pruebas con usuarios de L6 (T022, «mañana por la tarde»).
- **Sesión 2**: L4 y L6. **Al cerrar L6 se decide si se hacen L5a y L5b** (con las horas reales y las pruebas con usuarios); si se decide hacerlos, se ejecutan después de L6, primero L5a y luego L5b, cada uno con su propio cierre, revisión y commit.
- **Orden de ejecución**: L1 → L2 → L3 → L4 → L6 → L5a → L5b (el número del lote no es el orden). Como L6 va antes de L5, escribe el README y la evidencia solo de lo construido y marca P3 como «no incluido todavía (pendiente de decisión al cerrar L6)». Si se hace L5a o L5b, **su tarea de cierre actualiza `README.md` (qué incluye y qué queda fuera), `docs/evidencia/sc-checklist.md` y `docs/decisiones.md`, y vuelve a ejecutar `EVIDENCIA=1 npm run test:e2e -- matrix`** para regenerar la evidencia con las rutas nuevas.
- **Toda sesión termina con el lote en curso cerrado, commiteado y subido.**
- Para retomar sin perder contexto, `docs/decisiones.md` lleva una sección **«Estado de la sesión»** (lote cerrado, horas reales y qué sigue), que se actualiza al cierre de cada lote (se crea en L1).

### Mapa de cobertura

US1 → L1 · US2 → L2 · US3, US4 → L3 · US5, US6 → L4 · US8 → L5a · US7 → L5b · transversales (FR-037 a 043) → L1 y L6.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
