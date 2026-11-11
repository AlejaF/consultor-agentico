# Investigación (Fase 0): Agente real con IA

**Fecha**: 2026-11-11 | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

> «Verificado» = comprobado hoy en esta máquina o en la página oficial citada. «NO VERIFICADO» = no comprobado. Las instalaciones de prueba se hicieron fuera del repositorio, con `--ignore-scripts`, en una carpeta temporal del agente.

## 1. Bucle propio frente al Agents SDK de OpenAI

**Decisión**: bucle propio, aislado detrás de la interfaz `ModelClient`.

**Por qué**
- El verificador de citas con retroalimentación (AG-015, AG-016) y la traza (AG-009) son el núcleo de la función y deben controlarse por completo: cuándo se corta, qué error ve el modelo, qué se registra.
- Los topes de iteración y de tamaño (AG-008) y la regla de «sin reintentos automáticos ante gasto o saldo» (AG-011) son políticas propias; un SDK de agentes añade sus propios reintentos y reglas de parada que habría que desactivar o esquivar.
- El bucle son unas 100 líneas: llamar al modelo, ejecutar las llamadas a función que pida, devolver resultados o errores, repetir hasta que no pida más o se alcance un tope.
- Con `ModelClient` y un cliente FALSO guionado, todo el bucle se prueba sin gastar dinero.

| Criterio | Bucle propio + SDK `openai` | `@openai/agents` (Agents SDK) |
|---|---|---|
| Versión verificada | `openai` 7.55.0, Apache-2.0, Node `>=22` | `@openai/agents` 0.21.0, MIT (versión 0.x: API aún inestable, NO VERIFICADO su política de compatibilidad) |
| Control del verificador y la traza | Total | Posible por *guardrails*/hooks, con menos control del flujo (NO VERIFICADO el detalle) |
| Topes y reintentos | Los fijamos nosotros | Los del SDK; hay que revisar y desactivar (NO VERIFICADO) |
| Cambio de proveedor | `ModelClient` lo aísla | Acopla el bucle a OpenAI |
| Pruebas sin gasto | Cliente FALSO trivial | Requiere simular el modelo del SDK (NO VERIFICADO) |
| Dependencias nuevas | 1 (`openai`) | Varias transitivas (no se auditaron) |

**Alternativas descartadas**: Agents SDK (arriba); Chat Completions (la petición fija la Responses API); un solo prompt sin herramientas (no daría traza ni verificación con retroalimentación).

## 2. Responses API con herramientas de tipo función

**Decisión**: `openai.responses.create` con `tools: [{ type: 'function', ... }]`, bucle manual con la entrada acumulada, y **`store: false`**.

**Verificado**: `openai` 7.55.0 instala y trae `resources/responses`; el campo `store` aparece en sus tipos. Las páginas oficiales de modelos lo listan con soporte de «Functions» en Tools y endpoint `v1/responses` para `gpt-6-astra`, `gpt-6.1-sol` y `gpt-6-luna`.

**NO VERIFICADO**: la forma exacta de los objetos de llamada a función en 7.55.0 (se confirma en el lote C con una llamada real mínima); el comportamiento del SDK con reintentos internos (el SDK reintenta por defecto; se configurará `maxRetries: 0` y se probará, porque AG-011 prohíbe reintentos automáticos ante gasto o saldo).

**Por qué `store: false`**: por defecto la Responses API conserva las respuestas; la constitución (I, IX) y el aviso previo (AG-004) piden minimizar lo que se retiene. Esto **no** garantiza nada sobre la retención de entradas por parte del proveedor (NO VERIFICADO).

**Errores a normalizar** (de la guía oficial de errores, leída en versiones traducidas y en resultados de búsqueda; el texto exacto en inglés NO VERIFICADO):

| Código del proveedor | Categoría interna | Reintento | Mensaje a la persona |
|---|---|---|---|
| `organization_spend_limit_exceeded`, `project_spend_limit_exceeded` | `spend_limit` | **Nunca** | «Se alcanzó el límite de gasto de tu cuenta/proyecto de OpenAI. Súbelo o espera al próximo mes.» |
| `credit_balance_exhausted` | `balance` | **Nunca** | «Se agotó el saldo prepago. Agrega crédito.» |
| `insufficient_quota` (tipo) | `balance` | **Nunca** | igual al anterior |
| `rate_limit_exceeded` | `rate_limit` | A mano (la persona pulsa «Reintentar»); respeta `Retry-After` solo para informarlo | «Demasiadas solicitudes; reintenta en N s.» |
| 401 / clave ausente | `auth` | **Nunca** | «Falta la clave o no es válida.» |
| `organization_usage_limit_exceeded` | `usage_limit` | **Nunca** | «Se alcanzó un límite de uso fijado por OpenAI.» |
| 5xx / red | `provider_unavailable` | **Nunca automático** (decisión conservadora; se puede reintentar a mano) | «El proveedor no respondió.» |

Se decide por `error.code`, no solo por `error.type`, porque la guía indica que `type` puede seguir siendo `insufficient_quota` en varios casos.

## 3. Modelos por etapa: propuesta (no definitiva)

**Fuente**: páginas oficiales `developers.openai.com/api/docs/pricing.md`, `…/models` y `…/models/compare`, leídas el 2026-11-11. **Ninguna muestra fecha de publicación**; la de precios menciona «GPT-5.6 Sol's promotional pricing is available until November 30, 2026». Un resultado de búsqueda dio otra fecha para esa promoción (21 de noviembre) y una tarifa distinta para otro modelo: **hay inconsistencias entre fuentes secundarias; solo se usan las páginas oficiales y se re-verifican en el lote C**.

Precios estándar por 1M de tokens, contexto corto (≤ 272K):

| ID exacto (API) | Entrada | Entrada en caché | Salida | Function calling en Responses | Reasoning effort |
|---|---|---|---|---|---|
| `gpt-6-luna` | $0.10 | $0.01 | $0.50 | Sí (verificado en la comparación) | `none`, `low`, `medium`, `high`, `xhigh`, `max` |
| `gpt-6.1-terra` | $1.00 | $0.05 | $5.00 | «Functions» en Tools; endpoints no aparecen | `none`, `low`, `medium`, `high`, `xhigh`, `max` |
| `gpt-6.1-sol` | $2.00 | $0.10 | $10.00 | Sí | `low`, `medium`, `high`, `xhigh`, `max` (sin `none` en la página) |
| `gpt-6-astra` | $10.00 | $1.00 | $50.00 | Sí | `low`, `medium`, `high`, `xhigh`, `max` |

Los cuatro tienen ventana de 1.05 M y salida máxima de 128 K. La página recomienda «GPT-6 Astra» para «complex reasoning and coding», y «GPT-6.1 Sol» o «GPT-6 Luna» según equilibrio costo/inteligencia. **No aparece** una recomendación explícita para agentes o uso de herramientas. `gpt-5-nano` ($0.05/$0.40) es más barato en la página de precios, pero **no hay evidencia** de que soporte function calling.

**Propuesta** (la decide la persona responsable; las variables de entorno **no traen valor por defecto**):

| Etapa | Desarrollo y pruebas de humo | Demo | Evidencia |
|---|---|---|---|
| Diagnóstico (`OPENAI_MODEL_DIAGNOSTICO`) | `gpt-6-luna` | `gpt-6.1-sol` | Luna: el más barato con function calling confirmado. Sol: punto medio que la página sugiere para equilibrar costo e inteligencia. |
| Estrategia (`OPENAI_MODEL_ESTRATEGIA`) | `gpt-6-luna` | `gpt-6.1-sol` | Igual; la estrategia razona sobre pocos hallazgos ya verificados, así que el costo extra de un modelo mayor es menor. |
| Crítico (`OPENAI_MODEL_CRITICO`) | `gpt-6-luna` | `gpt-6.1-sol` | Mismo criterio; si objeta poco, subir de modelo es una decisión de la persona. |
| Nivel de razonamiento (`OPENAI_REASONING_*`) | `low` | `medium` | Subirlo gasta más tokens de salida; NO VERIFICADO su efecto en la calidad de las citas. |

**NO VERIFICADO**: calidad real de cada modelo en esta tarea, y que `gpt-6.1-terra` soporte function calling en Responses (la página no lo confirma). `gpt-6-astra` queda descartado para la demo por costo (≈5 veces Sol).

**Estimación de costo por corrida de diagnóstico (NO VERIFICADO; supuestos explícitos)**: 10 iteraciones, ~15 000 tokens de entrada acumulados por iteración sin caché = 150 000 tokens de entrada, y ~10 000 de salida.
- `gpt-6-luna`: 0.15 × $0.10 + 0.01 × $0.50 ≈ **$0.02**.
- `gpt-6.1-sol`: 0.15 × $2 + 0.01 × $10 ≈ **$0.40** (menos si la caché aplica; no se cuenta).

El costo real depende de los documentos y de los tokens de razonamiento; se mide en la prueba de humo (lote C) y la traza lo muestra (AG-009).

## 4. Servidor HTTP

**Decisión**: Fastify 5.12.8 (MIT) con `@fastify/cors` 11.4.1 y `@fastify/multipart` 10.1.8.

**Por qué**: manejo de multipart en memoria con límites declarativos (tamaño por archivo, número de archivos), validación de cuerpos, y la opción `listen({ host: '127.0.0.1' })` explícita. Cabe en ~150 líneas de arranque.

**Alternativas**: Express 5.3.0 (válido; requiere `multer` 2.5.0 aparte; sin ventaja aquí); Hono 4.13.18 (ligero, pero multipart y límites requieren más trabajo propio); `node:http` sin librería (más código propio de multipart y límites, más riesgo).

**Verificado**: las cuatro versiones existen con licencia MIT y `npm audit` de la instalación de prueba no reportó problemas para Fastify, CORS ni multipart (solo `exceljs`, ver §6).

## 5. Seguridad del servicio (principios II e IX)

- Escucha **solo en `127.0.0.1`** (no `0.0.0.0` ni `localhost`, que puede resolver a IPv6 de otra interfaz según el sistema).
- CORS con lista explícita de orígenes (`http://localhost:5173`, `http://127.0.0.1:5173`); el resto se rechaza. **Limitación**: CORS protege al navegador, no a otros procesos locales; cualquier proceso del equipo puede llamar al servicio. Mitigación opcional: un token efímero generado al arrancar y mostrado en la consola (**no** incluido en el alcance; se anota como decisión abierta del lote A).
- Validar `Host` y `Origin` en cada petición para frenar ataques de *DNS rebinding* contra un servicio local (NO VERIFICADO que CORS solo baste).
- El servicio nunca registra el contenido de documentos ni la clave; el registro solo guarda: método, ruta, estado, duración, tokens y categoría de error.
- Límites duros: tamaño de archivo (25 MB, igual a FR-010), número de archivos por proyecto, caracteres totales hacia el modelo (`MAX_INPUT_CHARS`), iteraciones (`MAX_ITERATIONS`, por defecto 10), tokens de salida (`MAX_OUTPUT_TOKENS`).
- Valores iniciales propuestos (NO VERIFICADO que sean adecuados; se ajustan con la prueba de humo): `MAX_INPUT_CHARS` 120 000, filas de XLSX 2 000 por hoja, páginas de PDF 200.

## 6. Extracción de texto

| Formato | Decisión | Versión | Licencia | Ubicación | Notas |
|---|---|---|---|---|---|
| PDF | `unpdf` | 2.1.0 | MIT, sin dependencias, Node `>=24` | página N | Empaqueta una compilación de PDF.js; la versión interna **NO VERIFICADO**. Sin OCR: PDF sin texto → mensaje claro (AG-007). |
| DOCX | `mammoth` | 1.13.0 | BSD-2-Clause | párrafo N | `extractRawText` separa párrafos con líneas en blanco. Dependencias: `@xmldom/xmldom`, `jszip`, `underscore`, `argparse`, otras. `npm audit` limpio. |
| XLSX | `read-excel-file` | 9.3.15 | MIT | hoja + fila | Dependencias: `saxen`, `fflate`, `worker-f`, `unzipper-esm`. `npm audit` limpio. Tope de filas. **API por confirmar en el lote B.** |
| TXT | propio | — | — | línea N | |
| VTT / SRT | propio (análisis de tiempos) | — | — | minuto (mm:ss de inicio del bloque) | Formato simple; sin dependencia. |

**Descartados**
- `xlsx` 0.18.5 (SheetJS en npm, Apache-2.0; última modificación en el registro 2026-07-17): **no se instaló ni se auditó**. De memoria (NO VERIFICADO), el proyecto distribuye las versiones nuevas fuera de npm y la 0.18.5 tendría avisos de seguridad conocidos; se descarta por no poder respaldarlo con evidencia y porque `read-excel-file` cubre la necesidad.
- `exceljs` 4.4.0: **verificado** que `npm audit` reporta 2 vulnerabilidades moderadas (`uuid` < 11.1.1) y que su última publicación fue en 2024-12; arrastra muchas dependencias (`archiver`, `unzipper`, `tmp`…).
- `pdf-parse` 2.4.5 (Apache-2.0): Node `>=22.3.0 <23 || …`; admite menos versiones de Node (verificado en `engines`); no se comparó su extracción por página con la de `unpdf` (NO VERIFICADO).
- `pdfjs-dist` 6.5.438 directo (Apache-2.0, Node `>=22.13`): válido pero obliga a configurar el *worker* y las fuentes; `unpdf` ya lo resuelve para Node.

**Riesgos de seguridad al leer archivos no confiables**: PDF, DOCX y XLSX son contenedores complejos. Mitigaciones: límites de tamaño y de filas/páginas, tiempo máximo por archivo, sin escribir a disco, y errores capturados por archivo (no tumban el servicio). **NO VERIFICADO** el comportamiento ante archivos cifrados, comprimidos con bombas zip o malformados; el lote B lo prueba con fixtures hostiles pequeños.

## 7. Verificación de citas

**Decisión**: función pura `verifyQuote(fragment, source)`:
1. Normalizar ambos textos: Unicode NFD, quitar marcas diacríticas, minúsculas, colapsar cualquier espacio en blanco a un espacio, recortar.
2. La cita es **verificada** si el fragmento normalizado (no vacío y de al menos N caracteres, por definir: 20) es una subcadena del texto normalizado del fragmento (*chunk*) de la ubicación citada.
3. Si no está en esa ubicación pero sí en otra del mismo archivo, el error devuelto al agente **incluye la ubicación correcta** para que corrija sin reinventar.
4. Si el archivo o la ubicación no existen, el error lo dice.

**Por qué en el fragmento de la ubicación y no en todo el archivo**: AG-014 exige ubicación; una cita con página falsa debe fallar. **Efecto secundario**: `ñ` y `n` se igualan por la normalización (consecuencia aceptada de «normalizar tildes»; AG-015 usa ese término).

**Límite honesto**: que el fragmento exista no prueba que la conclusión sea correcta (NO VERIFICADO la calidad de las conclusiones; por eso la revisión humana).

## 8. Búsqueda en la evidencia

**Decisión**: `buscar_en_evidencia(consulta)` por palabras clave: normaliza la consulta, puntúa cada fragmento por cuántos términos (sin palabras vacías) contiene y devuelve los mejores K (por defecto 5) con archivo, ubicación y un fragmento recortado. Sin base vectorial ni *embeddings* (la petición lo excluye; evita una segunda dependencia, otro costo y otra salida de texto al proveedor).

**Alternativa descartada**: enviar todos los documentos al modelo en el primer mensaje (simple, pero rompe el tope de tamaño de entrada y no produce una traza de herramientas).

## 9. Protección contra instrucciones dentro de documentos

- El prompt de sistema declara que el contenido recuperado son datos de un tercero y que **nunca** se obedecen órdenes que aparezcan allí.
- Los documentos solo llegan como resultado de `buscar_en_evidencia`, dentro de un envoltorio explícito (`<documento archivo="…" ubicacion="…">…</documento>`) y con el recordatorio de «datos, no instrucciones».
- El agente no tiene herramientas con efectos (sin red, sin archivos, sin comandos); lo peor que puede hacer un texto malicioso es sesgar el contenido, y por eso el flujo mantiene la revisión humana y el verificador de citas.
- Un detector heurístico opcional (frases tipo «ignora las instrucciones anteriores») puede anotar una advertencia en la traza (`puede registrarse`, AG-013 / caso límite). **No** es la defensa: la regla verificable es que se ignoran (AG-013).
- **NO VERIFICADO** que un modelo concreto resista siempre estos intentos; se prueba con un fixture que contiene una instrucción y se revisa el resultado a mano.

## 10. Formato de las claves de OpenAI y el escáner

**Fuentes** (todas de terceros; OpenAI no documenta públicamente el formato exacto): las claves actuales empiezan por `sk-proj-`, `sk-svcacct-` o `sk-admin-` y contienen la marca `T3BlbkFJ`; las antiguas son `sk-` + 48 caracteres; `sk-` solo colisiona con otros proveedores.

**Decisión** para `scripts/lib/secrets.mjs` (se afina con pruebas):
1. `sk-(proj|svcacct|admin)-[A-Za-z0-9_-]{20,}` (formato actual).
2. `sk-[A-Za-z0-9]{20,}T3BlbkFJ[A-Za-z0-9]{20,}` (formato con marca).
3. `sk-[A-Za-z0-9_-]{32,}` genérico (más falsos positivos; se permite una lista de excepciones por ruta con justificación).
4. Asignaciones sospechosas: `OPENAI_API_KEY\s*[:=]\s*['"]?[A-Za-z0-9_-]{16,}` y `(api[_-]?key|secret|token)\s*[:=]\s*['"][^'"]{16,}['"]`.
5. Se **excluyen** `.env.example` (sin valores) y los fixtures de las pruebas del propio escáner, que usan claves **falsas obviamente inventadas** con una marca de excepción.

Revisa: archivos versionados (lista de `git ls-files`), `dist/` completo, `server/.env.example`, y falla si encuentra `server/.env` versionado. **NO VERIFICADO** que cubra toda variante futura; es una red de seguridad, no la única defensa.

## 10 bis. `.gitignore` e `.env.example`

**Verificado**: el `.gitignore` actual contiene `.env*`, lo que **también ignora `.env.example`**. Se añade `!.env.example` y `!server/.env.example` y se prueba con `git check-ignore`.

## 11. Configuración por variables de entorno

Detalle en [contracts/env.md](./contracts/env.md). Se leen con `node --env-file=server/.env` (Node ≥ 20.6, **verificado** que está en Node 26) o desde el entorno; se validan con zod al arrancar, y el servicio **se niega a ejecutar corridas** (pero sí responde `/api/health` con `keyConfigured: false`) si falta la clave. **No hay valor por defecto de modelo** (IX): si falta, `/api/health` lo informa y la corrida se rechaza con un mensaje claro.

## 12. Persistencia v3 y migración

**Decisión**: `SCHEMA_VERSION = 3`; los datos v2 son un subconjunto exacto de v3, así que se hace una **migración sin pérdida** (cada proyecto queda con `mode: 'simulated'` y sin resultado real). Hoy una versión distinta reinicia el estado (verificado en `persistence.ts`: `notice: 'version'`); se conserva ese comportamiento para versiones desconocidas distintas de 2. Se guarda: modo, hallazgos generados, extractos citados, traza resumida, información faltante y objeciones. **No** se guarda el texto completo. Ver [contracts/persisted-state-v3.md](./contracts/persisted-state-v3.md).

## 13. Pruebas

- **Cliente FALSO guionado**: recibe una lista de respuestas (llamadas a función o texto final, o un error normalizado) y las devuelve en orden; permite probar tope de iteraciones, argumentos mal formados, reintentos del verificador, 429 de gasto sin reintento y estrategia sin respaldo.
- **Fixtures** (`scripts/make-fixtures.mjs`, «Empresa Ficticia Alfa»): un PDF con texto (escrito a mano como PDF mínimo), un PDF sin texto, un DOCX y un XLSX armados con `fflate`, un TXT, un VTT y un SRT, más hostiles pequeños (cifrado simulado, dañado, con una instrucción para la IA). **NO VERIFICADO** que los PDF y XLSX armados a mano los lean las librerías elegidas; el spike del lote B lo confirma y, si no, se ajusta el generador.
- **Playwright con el servicio en modo falso**: variable de entorno que selecciona el cliente FALSO; ese modo **no se puede activar** en un arranque normal sin la variable explícita.
- **Prueba de humo real**: una corrida con el modelo propuesto más barato sobre los fixtures; se guarda en `docs/evidencia/` solo el resumen (modelo, tokens, número de hallazgos, citas verificadas/fallidas), **sin clave y sin texto de documentos reales**.

## 14. Despliegue y desarrollo

- GitHub Pages sigue publicando solo el modo Simulado (sin cambios en el flujo de despliegue). `availability.ts` llama a `/api/health`; si no responde, muestra «IA real no disponible aquí (requiere ejecutar el backend en tu equipo)».
- Desarrollo: `npm run dev:server` (`node --env-file=server/.env --import tsx server/src/index.ts` con `--watch` opcional; **NO VERIFICADO** el comando exacto, se ajusta en el lote A), `npm run dev:all` con un script propio que arranca ambos procesos y los cierra juntos. Se evita `concurrently` (10.0.7, MIT, Node `>=22`) para no sumar una dependencia.
- Proxy de Vite hacia `/api` solo en desarrollo; la versión publicada (`vite build` + `preview`) **no** incluye el proxy.

## 15. Conservación y reconexión (AG-025, AG-030)

- El servicio guarda por proyecto: lista de archivos (nombre, tipo, estado de extracción, número de caracteres) y el texto por fragmento. `GET /api/evidence/:projectId` devuelve la lista; tras recargar la página la interfaz la pide y vuelve a mostrarla.
- Si el servicio se reinició, la lista llega vacía mientras el estado del navegador recuerda archivos que ya se subieron en modo real; la interfaz compara y avisa **qué archivos hay que volver a cargar** (AG-030). Para ello el navegador guarda solo `{id, nombre, tipo, tamaño}` por archivo (sin contenido), igual que hoy en la 001 (FR-012).
- **Cierre de pestaña durante la ejecución**: se aborta la corrida del lado del servicio cuando la conexión se cierra (NO VERIFICADO el comportamiento exacto de Fastify; se prueba en el lote C) y al volver no hay un resultado a medias presentado como completo.

## Preguntas resueltas y decisiones que se te piden

| # | Tema | Resolución |
|---|---|---|
| 1 | ¿Bucle propio o Agents SDK? | Bucle propio (§1). |
| 2 | ¿Qué XLSX? | `read-excel-file` (§6), con spike en el lote B. |
| 3 | ¿Qué PDF? | `unpdf` (§6). |
| 4 | ¿Modelo por etapa? | Propuesta en §3; **decide la persona responsable**. |
| 5 | ¿Migración v2 → v3? | Sin pérdida (§12); **confirmar**. |
| 6 | ¿Sector y mercado en modo real? | Ocultos (plan, riesgo 5); **confirmar**. |
| 7 | ¿Token entre navegador y servicio? | No incluido; se anota como mejora (§5). |
