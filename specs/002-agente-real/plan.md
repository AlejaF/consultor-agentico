# Plan de implementación: Agente real con IA

**Rama**: `002-agente-real` (carpeta del spec; no se creó rama) | **Fecha**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

**Entrada**: `specs/002-agente-real/spec.md` (historias US9 a US13, AG-001 a AG-030, SC-A1 a SC-A7). Extiende `specs/001-demo-consultor-agentico/` sin romperla.

> Convención: toda cifra de tiempo o costo es una **estimación NO VERIFICADO**. Lo comprobado el 2026-11-11 lo indica con «verificado» y su evidencia está en [research.md](./research.md).

## Resumen

Se añade un segundo modo, **IA real**, junto al modo **Simulado** de la 001. Dos piezas nuevas:

1. **Servicio local** (`server/`, Node + TypeScript, solo `127.0.0.1`): extrae el texto de los documentos, lo mantiene **solo en memoria**, ejecuta un **bucle de agente propio** contra OpenAI (Responses API, herramientas de tipo función) y devuelve resultado + traza al terminar. Es el único lugar con la clave.
2. **Capa de proveedor en el frontend**: dos implementaciones (Simulado = datos actuales; IA real = llama al servicio) detrás de `getDiagnosis` / `getStrategy`. Los hallazgos generados se persisten (con extractos citados y traza resumida), nunca el texto completo.

Enfoque técnico:
- **Bucle propio** sobre una interfaz `ModelClient` (implementaciones: OpenAI y FALSO guionado). El verificador de citas es código determinista dentro de la herramienta `registrar_hallazgo` y devuelve el error al agente para que corrija (máx. 2 reintentos por hallazgo).
- **Contenido de documentos = datos**: solo llega al modelo como resultado de herramientas y se declara así en el prompt de sistema; el agente no tiene herramientas con efectos (sin red, sin archivos).
- **Sin streaming**: cada `/run` devuelve resultado y traza completos; la interfaz muestra un indicador de carga.
- **La estrategia real reutiliza `deriveStrategy`**: lo que guarda el agente son elementos con `supportedBy`; al mostrarse se vuelven a filtrar con la misma regla de la 001 (SC-012 y SC-A4 se cumplen dos veces: al registrar y al mostrar).
- **Seguridad**: `scripts/check-secrets.mjs` dentro de `npm run check`, que revisa el repositorio y `dist/`; el servicio no registra contenido de documentos ni la clave.

## Contexto técnico

**Lenguaje/versión**: TypeScript 7.0.2 (modo estricto, igual que la 001) sobre Node v26.13.0 local (verificado). El servicio exige `>=24` (por `unpdf`); el frontend conserva `>=22.12`. CI de Pages sigue en Node 24 y **no ejecuta el servicio**.

**Dependencias principales** (versión exacta; verificadas con `npm view` el 2026-11-11, instalación de prueba con `--ignore-scripts` y `npm audit` fuera del repositorio; detalle en research.md). Van en `server/package.json`, **separado** del `package.json` raíz:

| Paquete | Versión | Licencia | Uso | Nota |
|---|---|---|---|---|
| `openai` | 7.55.0 | Apache-2.0 | SDK oficial (Responses API) | exige Node `>=22`; `store` presente en los tipos de Responses (verificado) |
| `fastify` | 5.12.8 | MIT | servidor HTTP | |
| `@fastify/cors` | 11.4.1 | MIT | CORS solo para el origen de Vite | |
| `@fastify/multipart` | 10.1.8 | MIT | recibir archivos en memoria | |
| `zod` | 4.6.7 | MIT | validar argumentos de herramientas y cuerpos | |
| `unpdf` | 2.1.0 | MIT | texto de PDF por página | exige Node `>=24`; sin dependencias |
| `mammoth` | 1.13.0 | BSD-2-Clause | texto de DOCX por párrafo | |
| `read-excel-file` | 9.3.15 | MIT | XLSX por hoja y fila | `npm audit` limpio; **API por confirmar en el lote B** |
| `tsx` | 4.23.15 | MIT | ejecutar/vigilar TypeScript en desarrollo | desarrollo |

`xlsx` (SheetJS de npm) y `exceljs` se descartaron (research.md §Extracción). `@openai/agents` 0.21.0 se evaluó y se descartó (research.md §Bucle).

**Almacenamiento**: navegador: `localStorage` con `schemaVersion` **3** (hallazgos generados, extractos citados, traza resumida, información faltante, objeciones, modo). Servicio: **solo memoria** del proceso (texto completo por proyecto y archivo); ningún archivo en disco (AG-025, AG-026).

**Pruebas**: Vitest 5.0.5 con `ModelClient` FALSO guionado (bucle, reintentos, tope de iteraciones, argumentos mal formados, verificador, errores de gasto); Playwright 1.64.1 con el servicio en modo falso; una prueba de humo manual con el modelo real y el modelo más barato, documentada en `docs/evidencia/`.

**Plataforma de destino**: GitHub Pages publica solo el modo Simulado; la IA real corre en el equipo de la persona.

**Tipo de proyecto**: aplicación web de página única + servicio local opcional (dos paquetes en un repositorio).

**Metas de rendimiento**: SC-A6 **NO VERIFICADO**: no se fija número hasta medir en el lote C. Hipótesis de trabajo, sin afirmar: una corrida de diagnóstico de 5 documentos cabe en pocos minutos.

**Restricciones**: servicio solo en `127.0.0.1`; CORS solo `http://localhost:5173` y `http://127.0.0.1:5173` (puerto de desarrollo; configurable); clave solo en `server/.env`; tope de iteraciones (por defecto 10) y de tamaño de entrada; sin reintentos automáticos ante gasto/saldo/clave; el modo Simulado pasa las pruebas de la 001 **sin modificarlas** (SC-A5).

**Escala/alcance**: 5 a 10 documentos por proyecto, 25 MB por archivo (límites de la 001), 6 pilares, decenas de fragmentos por documento.

## Verificación de la constitución (2.0.0)

*COMPUERTA: debe pasar antes de la Fase 0. Se reevaluó tras el diseño de la Fase 1: ver «Re-evaluación».*

| Principio | Cómo lo cumple el plan | Estado |
|---|---|---|
| **I. Datos ficticios y rotulados** | Repositorio, sitio publicado y fixtures (uno por formato, «Empresa Ficticia Alfa», generados por `scripts/make-fixtures.mjs`) son 100 % ficticios; `check-names` los revisa. En modo real los documentos propios viven solo en memoria del servicio y el estado del navegador no guarda su texto completo (AG-025, AG-026). Ningún informe de `docs/evidencia/` incluye documentos reales ni la clave. `referencias/` sigue en `.gitignore`. | Cumple |
| **II. Sitio estático publicado y backend local opcional** | El sitio publicado no cambia: estático, solo Simulado. `server/` solo escucha en `127.0.0.1`, es el único lugar con la clave y **no se despliega**. `check-secrets` revisa repositorio, historial reciente (`git grep` sobre el árbol, ver Riesgos) y `dist/`. El frontend **no** usa variables `VITE_*` con claves. | Cumple |
| **III. Honestidad** | Todo contenido del modelo lleva «Generado por IA (modelo X) · requiere revisión humana» (componente `AiBadge`, equivalente a `SimBadge`); «Simulada» solo en Simulado. Verificador determinista de citas (no el modelo). Aviso de privacidad que nombra a OpenAI y dice que el texto queda en memoria del servicio y no se guarda en disco (AG-004, AG-028). Lo no comprobado se marca NO VERIFICADO. | Cumple |
| **IV. Responsive y accesible** | Selector, aviso previo, `TraceView` y estados de carga/errores se construyen con elementos nativos, objetivos ≥ 44 px, regiones `aria-live` para el indicador de carga y los errores, y se verifican con la misma batería de la 001 (axe, 320/768/1280 px, teclado). | Cumple (verificación en lote D y F) |
| **V. Diseño como tokens** | Sin colores ni fuentes nuevos fuera de `tokens.css`; los estados nuevos (IA real, error) reutilizan tokens existentes o añaden tokens documentados. `check-tokens` sigue vigente. | Cumple |
| **VI. Especificación primero** | Este plan nace de `spec.md` vigente. **Brecha conocida**: la enmienda 2.0.0 aún no se refleja en spec/plan/tareas de la 001 (el AG-005 documenta las dos excepciones de FR-011 y SC-003). Hasta que la persona decida cómo propagarla, la 002 es el vehículo. Cambios de comportamiento durante la implementación vuelven al spec. | Cumple con una brecha anotada |
| **VII. Alcance acotado** | Prioridades P1/P2/P3 del spec; línea de corte explícita (G, el Crítico, se corta primero; luego US12). | Cumple |
| **VIII. Revisión por lote** | 7 lotes (A a G); cada uno termina con pruebas, revisión humana y commit **de la persona**; el agente no hace commit ni push. | Cumple |
| **IX. Seguridad y costo de la IA** | Clave solo en `server/.env` (ignorado) con `.env.example` sin valores (**ojo**: `.gitignore` tiene `.env*`, que también ignora `.env.example`; se añade `!.env.example`); `npm run check` falla ante claves en repo o `dist/`; tope de iteraciones (10) y de tamaño de entrada; escucha solo en `127.0.0.1`; documentos como datos y agente sin herramientas con efectos; el agente propone y la persona decide; el modelo por etapa viene de variables de entorno y **no hay valor por defecto aprobado** hasta que la persona lo decida. | Cumple |

**Restricciones adicionales de la constitución**: una sola aplicación web con acceso por rol (se mantiene); salidas simuladas rotuladas «Simulada» y salidas reales con el rótulo de IA (se mantiene); el sitio publicado funciona sin claves; idioma español.

Sin violaciones; «Seguimiento de complejidad» no aplica, salvo la justificación de un **segundo paquete** (`server/`): lo exige el principio II (la clave no puede vivir en el frontend) y lo mantiene separado para no tocar la instalación ni el CI de Pages.

## Estructura del proyecto

### Documentación (esta función)

```text
specs/002-agente-real/
├── spec.md
├── plan.md                         # Este archivo
├── research.md                     # Fase 0: decisiones, versiones, modelos y precios verificados
├── data-model.md                   # Fase 1: entidades, reglas, estado persistido v3
├── quickstart.md                   # Fase 1: cómo ejecutar y validar
├── contracts/
│   ├── api.md                      # Endpoints del servicio local
│   ├── agent-tools.md              # Herramientas de los agentes y sus verificadores
│   ├── model-client.md             # Interfaz ModelClient y errores normalizados
│   ├── persisted-state-v3.md       # Esquema v3 y migración desde v2
│   └── env.md                      # Variables de entorno
├── checklists/requirements.md
└── tasks.md                        # Lo crea /speckit-tasks (no este comando)
```

### Código fuente (raíz del repositorio)

```text
├── package.json                    # + scripts: dev:server, dev:all, check (añade check-secrets)
├── .gitignore                      # + !.env.example, server/.env
├── vite.config.ts                  # + proxy /api → http://127.0.0.1:8787 (solo desarrollo); include de Vitest + tests/server
├── scripts/
│   ├── check-secrets.mjs           # patrones de claves en repo y dist/
│   ├── lib/secrets.mjs             # patrones y búsqueda (con pruebas unitarias)
│   ├── make-fixtures.mjs           # genera los 6 archivos de ejemplo ficticios
│   └── dev-all.mjs                 # arranca servicio y Vite juntos (sin dependencia extra)
├── server/
│   ├── package.json                # dependencias del servicio, versiones exactas; engines node >=24
│   ├── tsconfig.json
│   ├── .env.example                # sin valores
│   └── src/
│       ├── index.ts                # arranque: escucha 127.0.0.1, CORS, límites
│       ├── config.ts               # lee y valida variables de entorno (zod)
│       ├── store.ts                # memoria: texto por proyecto y archivo
│       ├── routes/                 # health, evidence, diagnosis, strategy, critic
│       ├── extract/                # pdf.ts, docx.ts, xlsx.ts, text.ts, subtitles.ts, index.ts
│       ├── chunk.ts                # fragmentos con ubicación
│       ├── verify.ts               # normalización y verificación de citas (puro)
│       ├── search.ts               # buscar_en_evidencia por palabras clave
│       ├── agent/
│       │   ├── loop.ts             # bucle genérico (topes, errores, traza)
│       │   ├── tools.ts            # esquemas zod y ejecución de herramientas
│       │   ├── diagnosis.ts        # prompt y herramientas del Diagnóstico
│       │   ├── strategy.ts         # prompt y herramientas de la Estrategia
│       │   ├── critic.ts           # (P3)
│       │   └── trace.ts            # tipos y acumulador de traza
│       ├── model/
│       │   ├── client.ts           # interfaz ModelClient y errores normalizados
│       │   ├── openai.ts           # implementación OpenAI (Responses API)
│       │   └── fake.ts             # implementación FALSA guionada (solo pruebas)
│       └── log.ts                  # registro sin contenido de documentos ni claves
├── src/
│   ├── providers/                  # NUEVO: capa de proveedor
│   │   ├── types.ts                # DiagnosisProvider, StrategyProvider
│   │   ├── simulated.ts            # envuelve DIAGNOSIS y la plantilla de estrategia (comportamiento actual)
│   │   ├── real.ts                 # llama al servicio local
│   │   └── availability.ts         # GET /api/health y estado del selector
│   ├── state/                      # + modo por proyecto, resultado real, migración v2 → v3
│   ├── domain/                     # + realFindings.ts (conversión y reglas), review.ts/strategy.ts sin cambios de contrato
│   ├── components/                 # + ModeSelector, AiBadge, TraceView, MissingInfo, Objections, PrivacyNoticeReal, ServerFilesList
│   └── screens/                    # captura y diagnóstico usan getDiagnosis(proyecto)
├── tests/
│   ├── unit/                       # + pruebas de proveedor, migración v3, secrets
│   ├── server/                     # NUEVO: bucle, verificador, extracción, rutas (con cliente FALSO)
│   ├── fixtures/                   # archivos ficticios + guiones del cliente FALSO
│   └── e2e/                        # + ia-real.spec.ts (servicio en modo falso)
└── docs/evidencia/                 # + prueba de humo con el modelo real (sin claves ni documentos reales)
```

**Decisión de estructura**: dos paquetes independientes. `server/` tiene su propio `package.json` y lockfile; la instalación y el CI de la 001 no cambian. El frontend nunca importa código de `server/`; solo comparten el contrato de [contracts/api.md](./contracts/api.md), copiado como tipos en `src/providers/types.ts` (sin paquete compartido, para no acoplar los despliegues).

**Cambios a código de la 001 (acotados, para no romper SC-A5)**: los imports directos de `DIAGNOSIS` (`PillarGroups`, `DerivedFrom`, `UnverifiedCount`, `report.ts`, `maturity.ts`, `DeliveryReview`, `projects.ts`) pasan por `getDiagnosis(proyecto)`. Las funciones puras conservan su firma: el parámetro nuevo es **opcional** y por defecto usa `DIAGNOSIS.findings`, de modo que **ninguna prueba existente se modifica**. Cualquier prueba de la 001 que haya que tocar se trata como una señal de que el cambio rompió el modo Simulado.

## Lotes y calendario (estimaciones de tiempo de reloj, NO VERIFICADO)

**Regla de trabajo (decisión de la persona responsable, 2026-11-11)**: se trabaja **UN lote a la vez**. El agente **no genera código de un lote hasta que la persona apruebe el anterior** (revisión humana y commit hechos por ella, principio VIII). El agente no hace commit ni push.

**Unidad de las estimaciones**: tiempo de **reloj real**, no horas de desarrollador humano. Se separa en (a) generar código, (b) esperas inevitables (instalar paquetes, ejecutar pruebas y Playwright, corridas reales del modelo) y (c) revisión de la persona. **Ninguna cifra está medida**; salen de una suposición sin respaldo y se calibran con el registro de [docs/tiempos-002.md](../../docs/tiempos-002.md), que se llena al cerrar cada lote. Las estimaciones anteriores del plan («47 a 71 h») eran horas del agente y se **reemplazan** por esta tabla.

| Lote | Contenido | Historias / AG | (a) Generar código | (b) Esperas | (c) Revisión de la persona | Punto de control (qué se demuestra al cerrar) |
|---|---|---|---|---|---|---|
| **A. Base y seguridad** | `server/` mínimo (`/api/health`, 127.0.0.1, CORS, config por entorno), `.gitignore` (`!.env.example`), `.env.example`, `check-secrets` + `dist/` + pruebas del escáner, scripts `dev:server` y `dev:all`, proxy de Vite | AG-002, AG-010, AG-027, IX | 0,5–1 h | 0,25–0,5 h | 1,5–2,5 h (incluye crear cuenta y clave de OpenAI y fijar un tope de gasto bajo) | `npm run check` falla si se planta una clave falsa en repo y en `dist/`; `GET /api/health` responde solo en loopback |
| **B. Extracción y verificador** | Extractores de los 6 formatos con ubicaciones y topes; `chunk.ts`; `verify.ts`; `store.ts` en memoria; `POST /api/evidence` (y `GET`/`DELETE` para AG-030); script de fixtures | AG-006, AG-007, AG-015, AG-026, AG-030 (servidor) | 1–1,5 h | 0,5–1 h | 1,5–2,5 h | Los 6 fixtures se extraen con su ubicación; PDF sin texto, cifrado y dañado dan motivo claro; ningún archivo a disco; verificador con pruebas |
| **C. Agente de Diagnóstico** | `ModelClient` + FALSO + OpenAI, bucle con topes, herramientas, traza, errores normalizados, `POST /api/diagnosis/run`, prueba de humo con el modelo real | US9, US10, AG-008, AG-009, AG-011 a AG-013, AG-016, AG-017, AG-021 | 1,5–2,5 h | 0,5–1,5 h (incluye la corrida real) | 3–4,5 h (incluye decidir los modelos y la prueba de humo) | Pruebas con cliente FALSO verdes; una corrida real documentada con traza, modelo y tokens; **primera medición de SC-A6 y del costo** |
| **D. Frontend y persistencia** | Capa de proveedor, selector, aviso previo, lista de archivos del servicio, resultado real en el flujo de la 001, `TraceView`, rótulos, estado v3 y migración, modo por proyecto | US9, US10, AG-001, AG-003 a AG-005, AG-018, AG-023 a AG-025, AG-028 a AG-030 | 2–3 h | 1–2 h (suite de la 001 y Playwright) | 3–4,5 h | Recorrido completo con servicio en modo falso (e2e); **toda la batería de la 001 pasa sin cambios**; recarga conserva hallazgos y archivos |
| **E. Estrategia** | Agente de Estrategia, `POST /api/strategy/run`, integración con `deriveStrategy`, vista | US11, AG-019, AG-020 | 1–1,5 h | 0,5–1 h | 1,5–2,5 h | Ningún elemento sin hallazgo aceptado y verificado (SC-A4) |
| **F. Cierre** | Accesibilidad y responsive de lo nuevo, README, `docs/decisiones.md`, evidencia, suite completa, repaso de SC-A1 a SC-A7 | todos | 1–1,5 h | 1–1,5 h (suite completa) | 2–3 h | Suite verde; SC-A1 a SC-A5 y SC-A7 verificados; SC-A6 medido o NO VERIFICADO |
| **G. Crítico (P3)** | Agente Crítico, `POST /api/critic/run`, objeciones | US13, AG-022 | 1–1,5 h | 0,5–1 h | 1–2 h | Objeciones visibles sin cambiar el estado de ningún hallazgo |

**Totales (NO VERIFICADO)**:

| Alcance | (a) Generar | (b) Esperas | (c) Revisión | Suma en serie |
|---|---|---|---|---|
| A a F (US9, US10, US11, US12) | 7–11 h | 3,75–7,5 h | 12,5–20 h | 23–38,5 h |
| A a G (con el Crítico) | 8–12,5 h | 4,25–8,5 h | 13,5–22 h | 26–43 h |

Como se trabaja un lote a la vez, **la suma es en serie**: ningún tramo se solapa con la revisión del lote siguiente. La revisión de la persona es el tramo más grande y el menos controlable por el agente.

**Línea de corte**: **G (Crítico, P3) queda diferido** (decisión de la persona, 2026-11-11). **AG-021 (información faltante, P2) y AG-030 (reabrir archivos al recargar) quedan marcados como «recortables»**: se mantienen en el spec y en los lotes B, C y D tal como están; la persona decide en el **punto de control posterior al lote C**, con tiempos medidos, si se recortan. **Ajuste 2026-11-13 (decisión de la persona): AG-030 NO se difiere; sigue siendo recortable igual que AG-021, y las tareas de ambos (T078, T085, T087A y T087B) son las últimas de implementación del lote D**, para poder quitarlas sin tocar lo demás. **No se modifica el spec por esto.** Si se decide recortar, se registra entonces en el spec y en `docs/decisiones.md` antes de implementar (principio VI).

**Punto de control tras el lote C (decisión de la persona)**: (1) SC-A1 pasa en la prueba automática con el cliente falso; (2) una corrida real sobre los fixtures da hallazgos con citas verificadas, con modelo, tokens, tiempo y costo medidos (SC-A6); (3) límite de gasto y saldo agotado terminan sin ningún reintento (cliente falso); (4) el costo medido es aceptable; (5) con los tiempos reales de A a C se recalibra el resto y se decide sobre AG-021, AG-030 y el plazo.

**Orden y dependencias**: A → B → C → D → E → F, cada uno con aprobación y commit de la persona antes del siguiente. G depende de C y D y está diferido. Al cerrar cada lote el agente anota su tiempo real en [docs/tiempos-002.md](../../docs/tiempos-002.md).

## Riesgos y decisiones abiertas

1. **Modelos por etapa** — *decisión de la persona (2026-11-11)*: solo como **PROPUESTA pendiente**: `gpt-6-luna` en desarrollo y `gpt-6.1-sol` en la demo (research.md §3). La persona decidirá antes de la prueba de humo del lote C y lo registrará en `docs/decisiones.md`. Las variables de entorno no traen valor por defecto aprobado. NO VERIFICADO el desempeño real de cada modelo con estas tareas.
2. **Nombres y precios de modelos**: salen de la página oficial leída hoy; las tres páginas no coinciden en cobertura (la de comparación omite `gpt-6.1-terra`) y los resultados de búsqueda mostraron cifras contradictorias para otros modelos. Se re-verifican en el lote C antes de la prueba de humo.
3. **Historial de git**: `check-secrets` revisa el árbol de trabajo, `dist/` y los archivos en el índice; revisar *todo* el historial requiere una herramienta aparte (NO incluida). Mitigación: una clave nunca se escribe en un archivo versionado y `.env` está ignorado; se documenta en el README.
4. **Migración v2 → v3** — *confirmada por la persona (2026-11-11)*: **sin pérdida**; los proyectos existentes quedan en modo Simulado (los datos v2 son un subconjunto exacto de v3).
5. **Sector y mercado en modo real**: la 001 muestra análisis de sector y mercado «NO VERIFICADO · ilustrativo». El spec no pide generarlos con IA, así que en modo real se **ocultan** esas secciones (no se mezclan con contenido simulado, AG-029). *Confirmado por la persona (2026-11-11).*
6. **`read-excel-file` y `unpdf`**: su API exacta y su comportamiento ante archivos cifrados/dañados no se comprobaron más allá de la instalación y las auditorías; el lote B empieza con un experimento corto (spike) con los fixtures.
7. **Retención de datos en OpenAI**: la llamada usa `store: false` para no guardar respuestas; las políticas de retención del proveedor para entradas **NO VERIFICADO** y por eso el aviso previo lo dice sin prometer más.
8. **Costo por corrida**: estimado en research.md; **NO VERIFICADO** hasta medir tokens reales.
9. **Cierre de pestaña durante la ejecución**: el servicio no puede cancelar de forma fiable una llamada en curso; al desconectarse el cliente se aborta el bucle y se descarta el resultado (comportamiento a verificar en el lote C).

## Re-evaluación tras el diseño (Fase 1)

Sin cambios respecto a la compuerta inicial: ningún artefacto de diseño introduce escritura de documentos a disco, claves en el frontend ni publicación del servicio. Dos puntos quedaron como **decisiones abiertas** (riesgos 4 y 5) y uno como **brecha anotada** (principio VI).
