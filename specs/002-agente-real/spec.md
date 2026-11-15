# Especificación de la función: Agente real con IA

**Rama de la función**: `002-agente-real` (no se creó rama; la persona responsable decide el control de versiones, principio VIII)

**Creada**: 2026-11-11

**Estado**: Borrador · **cambio de alcance 2026-11-14 aprobado por la persona responsable el 2026-11-14, con las decisiones registradas abajo; la enmienda 2.1.0 a la constitución fue aprobada y aplicada el 2026-11-14** (AG-031, ajustes a AG-009, AG-021 y AG-023, SC-A8 y SC-A9)

**Entrada**: Especificación 002 «Agente real con IA». Extiende `specs/001-demo-consultor-agentico/spec.md` sin romperla. El modo Simulado de la 001 sigue funcionando igual y es lo que se publica en GitHub Pages.

**Gobierno**: Constitución **2.1.0** (principios I, II, III y IX en particular). La enmienda 2.1.0 (MINOR) al principio III fue aprobada y aplicada el 2026-11-14 (ver «Cambio de alcance 2026-11-14»). Todo lo que no se haya podido comprobar se marca **NO VERIFICADO**.

## Contexto y alcance

El profesor pidió más «implementación accionable de la IA (agentes)» y el uso de una API de pago. Esta especificación añade un segundo modo de trabajo, **IA real**, junto al modo **Simulado** de la 001:

- **Simulado**: es el comportamiento actual de la 001, sin cambios. Es el único modo disponible en la versión publicada.
- **IA real**: solo existe cuando la persona ejecuta en su propio equipo un servicio local opcional. Ese servicio envía el texto de los documentos al proveedor de IA (OpenAI) para producir hallazgos con citas literales a los documentos de la persona.

**Dentro del alcance**: diagnóstico con agente real (US9) **incluido el nivel de madurez por dimensión y el índice global (AG-031)**, traza y verificación de citas (US10), estrategia con agente real (US11), evidencia sugerida (US12) y agente Crítico (US13, P3).

**Fuera del alcance**: audio (sigue fuera, como en la 001); despliegue público de la IA real; autenticación real; cualquier almacenamiento del texto completo de los documentos; cambios al modo Simulado.

### Cambio de alcance 2026-11-14 (pendiente de aprobación)

Pedido por la persona responsable, aplicando el principio VI (spec → plan → tareas → código); **nada de esto está implementado**:

1. **Madurez en modo real (AG-031, P1)**: el índice de madurez ya **no** queda fuera del modo IA real. Reemplaza la decisión del lote D «sin índice de madurez en modo real», que queda marcada como **reemplazada** en `docs/decisiones.md`. Lotes nuevos: **D2** (madurez) y **D3** (presentación), entre D y E, en el orden **D → D2 → D3 → E**. **AG-031 modifica FR-058 solo para el modo «IA real»**: en Simulado el índice sembrado, ilustrativo y ficticio, su rótulo «(ilustrativo, ficticio)» y los promedios (2,5 con los datos de ejemplo) **no cambian**.
2. **Rótulo de IA sin nombre de modelo (AG-023)**: el rótulo visible pasa a «Generado por IA · requiere revisión humana». El modelo, la fecha y los tokens solo aparecen en la Traza del agente y en una «ficha técnica» del informe para los roles internos. **Modifica el principio III de la constitución** (enmienda propuesta abajo).
3. **Evidencia sugerida (AG-021)**: la información faltante se titula «Evidencia sugerida para fortalecer el diagnóstico» y aclara que son sugerencias de la IA, no hallazgos ni contenido verificado.
4. **Traza solo para roles internos (AG-009)**: visible para Consultor y Líder, nunca para la Empresa; plegada por defecto («Ver cómo trabajó el agente»); los avisos que afectan a la revisión se ven sin desplegarla.

**Decisiones de la persona (2026-11-14)**: escala entera de 1 a 5; los niveles **no** se revisan uno a uno (el índice se recalcula por código con los niveles que tengan respaldo vigente, como FR-025); el contador de revisión sigue contando solo hallazgos; la Empresa no ve ningún aviso técnico; `maturity` es opcional dentro de v3, sin subir la versión; orden D → D2 → D3 → E; se actualizan las pruebas del lote D que son de la 002.

**Enmienda a la constitución (MINOR: 2.0.0 → 2.1.0), APROBADA y aplicada el 2026-11-14**: en el principio III, el texto «Todo contenido producido por el modelo MUST rotularse «Generado por IA (modelo X) · requiere revisión humana»» pasa a «… MUST rotularse «Generado por IA · requiere revisión humana»; el modelo, la fecha y los tokens MUST guardarse en los datos y mostrarse solo en la traza y en la ficha técnica para los roles internos». **Por qué MINOR y no PATCH**: cambia el texto de un MUST (qué debe mostrar el rótulo) y añade una regla por rol, es decir, amplía la guía de forma material; **no** es MAJOR porque el principio no se elimina ni se redefine de forma incompatible: el rótulo sigue declarando que el contenido es de IA y que requiere revisión humana, y la información del modelo sigue disponible y auditable. **Por qué se propone**: la Empresa no necesita el nombre técnico del modelo para saber que el contenido es de IA; mostrarlo en cada tarjeta es ruido y puede confundir. **Riesgo a aceptar**: quien solo mira un hallazgo suelto ya no ve el modelo; lo ve en la traza y en la ficha técnica. Registro: texto vigente, versión y comentario de enmienda en `.specify/memory/constitution.md`, y `docs/decisiones.md`.

**Convención de identificadores**: requisitos `AG-001…`, criterios `SC-A1…`. Los FR y SC de la 001 se citan por su número (p. ej. FR-019) y siguen vigentes salvo donde se indique.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia 9 - Diagnóstico con agente real (Prioridad: P1)

El Consultor elige el modo «IA real», carga documentos propios (PDF, DOCX, XLSX, TXT, VTT o SRT), ve que el texto de cada uno se extrae, ejecuta el agente y recibe hallazgos por pilar con citas literales a sus propios documentos, con nombre del archivo y ubicación (página, párrafo, hoja y fila, línea o minuto). Los hallazgos entran al mismo flujo de revisión, emisión, calificación e informe de la 001.

**Por qué esta prioridad**: es la razón de la función; sin ella no hay agente real. Convierte la demo de un recorrido preparado en un análisis sobre documentos reales de la persona.

**Prueba independiente**: con el servicio local disponible y un documento de texto de ejemplo, elegir «IA real», cargar, ejecutar y obtener al menos un hallazgo con una cita que se abre y muestra el fragmento del propio archivo. Entrega valor aunque US10 a US13 no existan.

**Escenarios de aceptación**:

1. **Dado** que el servicio local está disponible y el Consultor está en el modo «IA real», **Cuando** carga un archivo permitido, **Entonces** ve que el texto se extrae y cuántos caracteres o secciones se obtuvieron, antes de poder ejecutar el agente.
2. **Dado** documentos con texto extraído, **Cuando** ejecuta el agente, **Entonces** recibe hallazgos agrupados por pilar, cada uno con al menos una cita que indica el archivo y la ubicación.
3. **Dado** un diagnóstico real generado, **Cuando** el Consultor lo revisa, **Entonces** puede aceptar, editar o rechazar, emitir, y el Líder lo califica y se imprime el informe con las reglas de la 001 (FR-019 a FR-022, FR-029).
4. **Dado** un archivo de más de 25 MB, con nombre de más de 150 caracteres, de un formato no permitido o de audio, **Cuando** intenta cargarlo, **Entonces** se rechaza con el mismo motivo claro que en la 001 (FR-010).
5. **Dado** un diagnóstico real generado y revisado, **Cuando** el Consultor lo abre, **Entonces** ve un nivel de madurez por cada una de las seis dimensiones, cada uno con su justificación corta, «basado en N hallazgos» y los hallazgos de los que deriva; una dimensión sin hallazgos verificados dice «Sin evidencia suficiente · NO VERIFICADO» y una cuyos hallazgos aceptados o editados y verificados no existen (todos rechazados o aún sin revisar) dice «Sin respaldo vigente», ambas sin número; el índice global se calcula por código con los niveles respaldados y lleva «Calculado por código a partir de niveles propuestos por IA» (AG-031).

---

### Historia 10 - Traza y verificación con retroalimentación visible (Prioridad: P1)

Los roles internos (Consultor y Líder) ven la «Traza del agente», plegada por defecto: cada herramienta que usó y con qué consulta, y cada verificación de cita que falló con la forma en que el agente la corrigió o la descartó. Una cita se considera verificada solo si el fragmento citado aparece literalmente en el texto fuente, ignorando diferencias de mayúsculas, tildes y espacios. Un hallazgo sin respaldo suficiente se marca NO VERIFICADO (igual que en la 001) y no respalda la estrategia.

**Por qué esta prioridad**: sin verificación y traza, el contenido de la IA no es confiable ni auditable. Es lo que distingue un agente de un resumen opaco y sostiene el principio III de la constitución.

**Prueba independiente**: ejecutar el agente sobre un documento conocido y comprobar que (a) la traza lista cada paso, (b) toda cita marcada como verificada se encuentra literalmente en el texto fuente y (c) una cita alterada a propósito se marca como fallida.

**Escenarios de aceptación**:

1. **Dado** una corrida terminada y un rol interno (Consultor o Líder), **Cuando** abre «Ver cómo trabajó el agente» (plegado por defecto), **Entonces** ve cada herramienta usada, su consulta, el modelo utilizado, la fecha, los tokens consumidos y los errores ocurridos.
2. **Dado** una cita cuyo fragmento no aparece en la fuente, **Cuando** el sistema la verifica, **Entonces** la traza registra el fallo y cómo se resolvió (corregida por el agente o descartada), y la cita nunca se muestra como verificada.
3. **Dado** un hallazgo sin ninguna cita verificada, **Cuando** se muestra, **Entonces** lleva «NO VERIFICADO» con la razón y, si está aceptado o editado, «No se usará como respaldo de la estrategia» (FR-018).
4. **Dado** una cita que coincide solo tras ignorar mayúsculas, tildes y espacios, **Cuando** se verifica, **Entonces** se considera verificada.
5. **Dado** el rol Empresa, **Cuando** abre el diagnóstico o el informe, **Entonces** no ve la traza, ni el modelo, ni la fecha de la corrida, ni los tokens, ni los avisos técnicos de la corrida.
6. **Dado** una corrida con resultado parcial o con errores, **Cuando** un rol interno abre la pantalla sin desplegar la traza, **Entonces** ve igualmente el aviso que afecta a la revisión.

---

### Historia 11 - Estrategia con agente real (Prioridad: P1)

A partir solo de los hallazgos aceptados o editados y verificados, un agente propone riesgos y una ruta. Cada elemento indica de qué hallazgos deriva; un elemento sin hallazgo de respaldo válido no se muestra. Se reutilizan las reglas FR-024 a FR-027 de la 001.

**Por qué esta prioridad**: cierra el flujo Evidencia → Diagnóstico → Estrategia con IA real y protege la regla central de trazabilidad (FR-025, SC-012).

**Prueba independiente**: con un diagnóstico real emitido que tenga hallazgos aceptados y verificados, generar la estrategia y comprobar que ningún riesgo ni fase cita un hallazgo rechazado, no verificado o inexistente.

**Escenarios de aceptación**:

1. **Dado** un diagnóstico real emitido, **Cuando** el Consultor genera la estrategia, **Entonces** recibe riesgos (con nivel) y ruta por fases, cada uno con sus hallazgos de origen.
2. **Dado** un elemento propuesto por el agente cuyo respaldo no es un hallazgo aceptado o editado y verificado, **Cuando** se arma la estrategia, **Entonces** ese elemento no se muestra.
3. **Dado** una estrategia real, **Cuando** el Consultor pulsa «Enviar a revisión», **Entonces** se crea la entrega al Líder sin duplicarse (FR-027).

---

### Historia 12 - Evidencia sugerida (Prioridad: P2)

El agente sugiere, por pilar, qué evidencia habría ayudado a respaldar mejor el diagnóstico. En pantalla se titula «Evidencia sugerida para fortalecer el diagnóstico». Es texto de salida; no crea flujos nuevos.

**Por qué esta prioridad**: ayuda a la persona a mejorar su evidencia, pero el flujo funciona sin ella.

**Prueba independiente**: ejecutar un diagnóstico real con evidencia escasa en un pilar y comprobar que aparece, para ese pilar, qué evidencia faltó, rotulada como generada por IA.

**Escenarios de aceptación**:

1. **Dado** un diagnóstico real, **Cuando** la persona lo abre, **Entonces** ve para cada pilar una lista titulada «Evidencia sugerida para fortalecer el diagnóstico», rotulada «Generado por IA · requiere revisión humana» y con la frase «Son sugerencias de la IA, no hallazgos ni contenido verificado».
2. **Dado** esa lista, **Cuando** la persona la consulta, **Entonces** no hay botones ni pasos nuevos derivados de ella.

---

### Historia 13 - Agente Crítico (Prioridad: P3, recortable primero)

Un segundo rol revisa los hallazgos antes de que lleguen al Consultor, objeta lo débil o contradictorio y esas objeciones se muestran junto a los hallazgos. La decisión sigue siendo del Consultor.

**Por qué esta prioridad**: añade una segunda mirada, pero no es necesaria para el flujo; se corta primero si falta tiempo (principio VII).

**Prueba independiente**: con hallazgos que se contradicen, comprobar que el Crítico muestra una objeción y que el Consultor puede aceptar el hallazgo de todos modos.

**Escenarios de aceptación**:

1. **Dado** hallazgos débiles o contradictorios, **Cuando** el Crítico los revisa, **Entonces** se muestran objeciones asociadas a cada hallazgo, rotuladas como generadas por IA.
2. **Dado** un hallazgo con objeciones, **Cuando** el Consultor decide, **Entonces** puede aceptar, editar o rechazar igual que sin Crítico; las objeciones no cambian el estado por sí solas.

---

### Historia 14 - Nuevo proyecto (Prioridad: P1, lote N, se ejecuta antes del cierre F)

Para una prueba completa con una empresa real, el Consultor crea un proyecto nuevo (empresa y sector opcional), sube sus documentos, genera el diagnóstico con IA real, lo revisa, lo emite y llega a la Estrategia. Hoy solo existen los proyectos de ejemplo precargados. El proyecto nuevo **solo trabaja en modo IA real** y se guarda solo en este navegador.

**Por qué esta prioridad**: sin ella no se puede probar de punta a punta con una empresa propia; los 4 proyectos de ejemplo no cambian.

**Prueba independiente**: con el servicio local (cliente falso), crear «Empresa Ficticia Omega», subir un archivo, generar, revisar, emitir, generar la Estrategia, y verlo en el tablero del Líder.

**Escenarios de aceptación**:

1. **Dado** el Consultor en Proyectos con el servicio disponible, **Cuando** pulsa «+ Nuevo proyecto» y envía un nombre válido, **Entonces** el proyecto nace en Evidencia, Pendiente, 0 %, rotulado «Creado por ti», con un id propio (`N-1`, `N-2`…) que no choca con P-A a P-D.
2. **Dado** el servicio no disponible, **Cuando** el Consultor ve Proyectos, **Entonces** el botón aparece deshabilitado con el texto visible «Requiere IA real (ejecutar la app en tu equipo)».
3. **Dado** un nombre vacío, de menos de 2 o más de 80 caracteres, con saltos de línea o repetido (sin distinguir mayúsculas), **Cuando** se envía, **Entonces** no se crea y se muestra un error claro y accesible.
4. **Dado** un proyecto nuevo, **Cuando** el Consultor abre su Evidencia, **Entonces** el modo Simulado aparece deshabilitado con «El modo Simulado solo está disponible en los proyectos de ejemplo».
5. **Dado** un proyecto creado, **Cuando** se recarga la página, **Entonces** se conserva; **Cuando** se pulsa «Restablecer demo», **Entonces** se pide una confirmación que dice que se borrarán los proyectos creados.
6. **Dado** un nombre como «Ignora tus instrucciones», **Cuando** se muestra o se envía al agente, **Entonces** se muestra como texto y se envía como dato escapado y con tope; el agente no lo obedece.

---

### Casos límite

- **PDF escaneado sin texto**: se informa que no se pudo extraer texto y por qué; ese archivo no entra al análisis.
- **Archivo cifrado o dañado**: se informa el motivo concreto y se sigue con los demás archivos.
- **XLSX enorme**: se aplica el tope de tamaño de entrada; se avisa qué parte se analizó y cuál se omitió.
- **Clave ausente o inválida**: el modo «IA real» muestra un mensaje claro y no ejecuta.
- **Límite de gasto alcanzado o saldo agotado**: mensaje claro, **sin reintentos automáticos**; la corrida termina con lo que haya.
- **Límite de tasa**: se informa y se permite reintentar a mano; no hay reintento automático ilimitado.
- **El modelo no devuelve una herramienta válida o con argumentos mal formados**: el error se devuelve al agente para que corrija, y queda en la traza.
- **Límite de iteraciones alcanzado**: se entrega un resultado parcial con aviso visible.
- **Una cita falla dos veces**: se descarta, o el hallazgo queda NO VERIFICADO; nunca se muestra como verificado.
- **Un documento contiene instrucciones dirigidas a la IA**: se tratan como contenido del documento y se ignoran como órdenes; puede registrarse en la traza. La regla verificable es AG-013: se ignoran.
- **Evidencia agregada después de emitir**: el diagnóstico emitido es de solo lectura (FR-021) y no se vuelve a ejecutar; la evidencia nueva no lo modifica.
- **Cierre de la pestaña durante la ejecución**: la corrida se interrumpe, no queda un resultado a medias presentado como completo, y al volver la persona puede ejecutar de nuevo.
- **Recarga de la página con el servicio local en ejecución**: la persona ve de nuevo los archivos ya cargados y puede volver a ejecutar el agente sin recargarlos (AG-030).
- **Servicio local reiniciado o cerrado**: la memoria se pierde; el sistema MUST avisar qué archivos hay que volver a cargar, y los hallazgos y extractos ya conservados siguen visibles.
- **Servicio local no disponible** (p. ej. en la versión publicada): el selector indica que «IA real» no está disponible y el modo Simulado funciona normalmente.

## Requisitos *(obligatorio)*

### Requisitos funcionales

**Modo y disponibilidad**

- **AG-001**: El sistema MUST mostrar un selector visible «Simulado / IA real» donde se carga evidencia y se genera el diagnóstico y la estrategia, e indicar siempre cuál modo está activo.
- **AG-002**: El sistema MUST detectar si el servicio local de IA real está disponible. Si no lo está, MUST mostrar «IA real» como no disponible con un mensaje claro de cómo habilitarla, y MUST dejar el modo Simulado funcionando sin cambios. En la versión publicada solo existe el modo Simulado.
- **AG-003**: El modo Simulado MUST comportarse exactamente como en la 001 (FR-001 a FR-029 y SC-001 a SC-015 aplicables al modo Simulado).

**Privacidad y carga**

- **AG-004**: Antes de cargar archivos en modo «IA real», el sistema MUST avisar que el texto se envía al servicio local y a OpenAI como proveedor de IA, que el texto se mantiene en la memoria del servicio local mientras esté en ejecución y que no se guarda en disco, y MUST exigir que la persona lo vea antes de poder cargar. Este aviso es distinto del aviso del modo Simulado.
- **AG-005**: Esta especificación **modifica FR-011 y SC-003 solo para el modo «IA real»**: en ese modo el texto sí sale del navegador hacia el servicio local y hacia el proveedor, y SC-003 no aplica. En modo Simulado FR-011 y SC-003 siguen íntegros.
- **AG-006**: En modo «IA real» el sistema MUST aceptar PDF, DOCX, XLSX, TXT, VTT y SRT con los mismos límites de la 001 (25 MB, nombre de hasta 150 caracteres, FR-010); el audio sigue fuera.
- **AG-007**: El sistema MUST extraer el texto de los seis formatos, mostrar a la persona que la extracción ocurrió y, cuando no se pueda (PDF escaneado sin texto, archivo cifrado o dañado), MUST decir el motivo concreto de ese archivo.

**Agente, límites y traza**

- **AG-008**: El agente MUST tener un tope de iteraciones y un tope de tamaño de entrada. Al alcanzarlos, MUST entregar un resultado parcial con un aviso visible.
- **AG-009** *(modificado 2026-11-14)*: El sistema MUST registrar la «Traza del agente» de cada corrida (herramientas usadas con su consulta, verificaciones de cita fallidas y su resolución, modelo usado, fecha, tokens consumidos y errores) y MUST mostrarla **solo a los roles internos (Consultor y Líder), nunca a la Empresa**. En pantalla MUST estar **plegada por defecto** bajo el título «Ver cómo trabajó el agente». Los avisos que afectan a la revisión (resultado parcial por tope de iteraciones o de entrada, y errores de la corrida) MUST verse a los roles internos **sin desplegar la traza**. La Empresa MUST NOT ver traza, modelo, fecha de corrida, tokens ni avisos técnicos de la corrida.
- **AG-010**: El modelo de cada etapa (diagnóstico, estrategia, crítico) MUST ser configurable fuera del código y MUST mostrarse en la traza. Su valor por defecto MUST NOT cambiarse sin decisión registrada de la persona responsable.
- **AG-011**: Ante límite de gasto, saldo agotado o clave ausente o inválida, el sistema MUST mostrar un mensaje claro y MUST NOT reintentar automáticamente; ante límite de tasa MUST informarlo y permitir reintentar a mano.
- **AG-012**: Si el modelo propone una herramienta inválida o con argumentos mal formados, el sistema MUST devolver el error al agente para que corrija y MUST registrarlo en la traza.
- **AG-013**: El contenido de los documentos MUST tratarse como datos, nunca como instrucciones; las instrucciones dirigidas a la IA dentro de un documento MUST ignorarse.

**Diagnóstico, citas y verificación**

- **AG-014**: El diagnóstico real MUST producir hallazgos agrupados por pilar, cada uno con citas literales que indiquen el archivo y la ubicación según el tipo (página; párrafo; hoja y fila; línea; minuto).
- **AG-015**: Una cita MUST considerarse verificada solo si el fragmento citado aparece literalmente en el texto fuente tras normalizar mayúsculas, tildes y espacios. La verificación MUST hacerla un proceso determinista, no el modelo.
- **AG-016**: Una cita no verificada MUST NOT presentarse como verificada. Si falla, el agente MUST corregirla o descartarla; si una cita falla dos veces, MUST descartarse o dejar el hallazgo NO VERIFICADO.
- **AG-017**: Un hallazgo sin respaldo suficiente MUST marcarse NO VERIFICADO con la razón (FR-018) y MUST NOT respaldar la estrategia (FR-025).
- **AG-018**: Los hallazgos reales MUST entrar al mismo flujo de revisión, emisión, calificación e informe de la 001 (FR-019 a FR-022, FR-028, FR-029, SC-014).

**Estrategia**

- **AG-019**: La estrategia real MUST generarse solo a partir de hallazgos aceptados o editados y verificados, con riesgos (con nivel) y ruta por fases, y cada elemento MUST indicar los hallazgos de los que deriva, según FR-024 a FR-027.
- **AG-020**: Un elemento de la estrategia sin al menos un hallazgo de respaldo válido MUST NOT mostrarse (SC-012).

**Información faltante y Crítico**

- **AG-021** *(P2, modificado 2026-11-14)*: El agente MUST sugerir, por pilar, la evidencia que habría ayudado a respaldar mejor el diagnóstico, como texto de salida sin flujos nuevos. En pantalla MUST titularse **«Evidencia sugerida para fortalecer el diagnóstico»** y MUST llevar la frase **«Son sugerencias de la IA, no hallazgos ni contenido verificado.»** Una sugerencia MUST NOT contarse como hallazgo, ni respaldar la estrategia, ni entrar en el índice de madurez.
- **AG-022** *(P3)*: El agente Crítico MUST revisar los hallazgos antes de que lleguen al Consultor y mostrar objeciones sobre los débiles o contradictorios; MUST NOT aceptar, rechazar ni editar hallazgos por sí mismo.

**Rotulado**

- **AG-023** *(modificado 2026-11-14; enmienda 2.1.0 al principio III aprobada y aplicada)*: Todo contenido producido por el modelo (hallazgos, niveles de madurez, justificaciones, índice, evidencia sugerida, objeciones y textos de estrategia) MUST llevar el rótulo visible **«Generado por IA · requiere revisión humana»**, **sin nombre de modelo**. El modelo, la fecha y los tokens MUST mostrarse solo (a) en la Traza del agente (AG-009) y (b) en una **«ficha técnica»** del informe, visible e imprimible únicamente para los roles internos (Consultor y Líder), nunca para la Empresa. El modelo MUST seguir guardándose en los datos (AG-025). El rótulo «Simulada» se conserva solo para el modo Simulado.
- **AG-024**: Las citas reales MUST rotularse «Extracto de tu archivo» y MUST NOT llevar «Evidencia de ejemplo (ficticia)».

**Conservación y privacidad de datos**

- **AG-025**: Los hallazgos, los extractos citados, la traza resumida (modelo, tokens, errores), la información faltante y las objeciones del Crítico MUST conservarse entre recargas; el texto completo de los archivos MUST NOT conservarse en el navegador ni en disco. Puede mantenerse únicamente en la memoria del servicio local mientras este siga en ejecución (AG-026).
- **AG-026**: Ningún documento MUST guardarse en disco por el servicio local; el contenido vive solo en la memoria del servicio mientras este siga en ejecución.

**Modo por proyecto**

- **AG-029**: El modo (Simulado o IA real) MUST quedar fijado por proyecto desde que se genera su diagnóstico; MUST NOT mezclarse hallazgos simulados y reales en un mismo proyecto. Cambiar de modo MUST exigir un proyecto nuevo o limpiar el diagnóstico, y el sistema MUST explicarlo a la persona.

- **AG-030**: Si la persona recarga la página y el servicio local sigue en ejecución, el sistema MUST mostrar de nuevo los archivos ya cargados (nombre, tipo y estado de extracción) y MUST permitir volver a ejecutar el agente sin volver a cargarlos. Si el servicio se reinició o se cerró, MUST avisar qué archivos hay que volver a cargar.

**Madurez**

- **AG-031** *(P1, nuevo 2026-11-14, decisiones de la persona incorporadas)*: En modo «IA real» el diagnóstico MUST incluir un **nivel de madurez por cada una de las seis dimensiones** y un **índice global**. **AG-031 modifica FR-058 solo para el modo «IA real»**; el índice simulado no cambia (ver «Lo que dice la 001 sobre la madurez» abajo):
  1. **Escala (decidida)**: el índice global es un número de 1,0 a 5,0, mostrado «de 5» con coma decimal (FR-057, FR-058). Cada nivel de dimensión es un **entero de 1 a 5**.
  2. **Propuesta del modelo**: cada nivel lo propone el agente, MUST citar al menos un hallazgo verificado **de ese mismo pilar** del que deriva (por su id `R…`) y MUST llevar una justificación corta (texto, hasta 300 caracteres).
  3. **Sin evidencia**: una dimensión sin hallazgos verificados MUST quedar «Sin evidencia suficiente», marcada **NO VERIFICADO**, sin nivel numérico y **fuera del cálculo**.
  4. **Rechazo de respaldo inválido**: un nivel que cite un hallazgo inexistente o no verificado MUST rechazarse (el error vuelve al agente, con el mismo máximo de 2 reintentos de AG-016); si no se corrige, la dimensión queda «Sin evidencia suficiente». Un nivel sin hallazgo verificado MUST NOT mostrarse con número.
  5. **Respaldo vigente (misma lógica que FR-025)**: un nivel solo cuenta si al menos uno de los hallazgos que cita está **aceptado o editado y verificado**; un hallazgo rechazado, pendiente de revisión o NO VERIFICADO no cuenta. Un nivel sin ningún hallazgo de ese tipo MUST mostrarse como **«Sin respaldo vigente»** (con la razón: sus hallazgos fueron rechazados o aún no están aceptados), sin número, y MUST salir del promedio. El código lo recalcula siempre con las decisiones actuales, sin volver a llamar al modelo.
  6. **No hay revisión por nivel**: los niveles MUST NOT tener Aceptar, Editar ni Rechazar propios. La persona los influye solo decidiendo sobre los hallazgos. AG-031 MUST NOT cambiar `reviewProgress` ni `canIssue` de la 001: el contador de revisión cuenta solo hallazgos y «Aprobar y emitir» se rige por FR-021 sin cambios.
  7. **«Basado en N hallazgos»**: cada nivel con respaldo vigente MUST mostrar «basado en N hallazgos» («basado en 1 hallazgo» si N = 1), donde N es el número de hallazgos citados que tienen respaldo vigente, junto a «Deriva de: …» con esos hallazgos.
  8. **Índice calculado por código**: el índice global MUST ser el promedio de los niveles con respaldo vigente, calculado por código determinista y recalculado en cada vista. El modelo MUST NOT proponer, escribir ni corregir el índice, y ninguna herramienta del agente MUST aceptarlo. Sin ningún nivel con respaldo vigente, se muestra «—». El índice no se guarda.
  9. **Rótulos**: cada nivel y su justificación MUST llevar «Generado por IA · requiere revisión humana» (AG-023). El índice real MUST llevar **«Calculado por código a partir de niveles propuestos por IA»** y MUST NOT llevar «(ilustrativo, ficticio)», porque no es un valor sembrado; en Simulado FR-058 sigue igual.
  10. **Promedios e informe**: los proyectos reales MUST contar en los promedios del tablero del Líder (FR-057), en el informe imprimible, en la revisión de la entrega y en el inicio de la Empresa, como en la 001, solo mientras su diagnóstico esté emitido; un proyecto real con índice «—» no entra en el promedio. Sigue sin haber promedio por pilar (FR-057).
  11. **Nota de mezcla en el tablero del Líder**: cuando el promedio del tablero mezcla al menos un proyecto Simulado y al menos un proyecto real con índice, el tablero MUST mostrar, bajo el indicador «Madurez promedio (de 5)», la línea «El promedio mezcla proyectos simulados (ilustrativos) y reales (estimados por IA)»; sin mezcla (p. ej. solo los datos de ejemplo de la 001) la línea MUST NOT aparecer. Una sola línea cubre también los promedios por equipo, porque el promedio total incluye a todos los equipos.
  12. **Persistencia**: los niveles, sus justificaciones y los hallazgos que citan MUST conservarse entre recargas (AG-025), como campo opcional del estado v3 (sin subir `schemaVersion`); el índice no se guarda.

  **Lo que dice la 001 sobre la madurez (leído el 2026-11-14)**: (a) existe **solo un índice global por proyecto**; **no existen niveles por dimensión**: FR-058 dice que el índice no se calcula «de los hallazgos ni de dato alguno por pilar, que no existe»; (b) la escala es «de 5»: el índice es un valor **ilustrativo, ficticio y sembrado** por proyecto (p. ej. 2,4; 3,1; 1,8; 2,8), mostrado con coma decimal y el rótulo «(ilustrativo, ficticio)»; (c) FR-057 lo promedia por equipo y en total (con «—» si no hay diagnóstico emitido) y excluye el promedio por pilar; (d) las reglas de revisión (FR-019 a FR-021: Aceptar, Editar, Rechazar, «N de M revisados», emitir con todo revisado) se aplican **solo a hallazgos**; el índice **no se revisa ni se calcula**. Por eso «la misma escala y las mismas reglas de revisión» se resolvió así por decisión de la persona (2026-11-14): la escala de 5 se conserva (niveles enteros de 1 a 5) y la revisión **no** se extiende a los niveles; el índice se recalcula por código usando solo niveles con respaldo vigente, con la lógica de FR-025 para la estrategia.

**Seguridad**

- **AG-027**: Ninguna clave del proveedor MUST aparecer en el repositorio, su historial, la interfaz ni los archivos publicados, y la verificación automática del proyecto MUST fallar si encuentra una (principio IX).
- **AG-028**: Todo aviso de privacidad MUST nombrar al proveedor al que se envía el texto.
- **AG-032** *(P1, lote N)*: El Consultor MUST poder crear proyectos nuevos. (1) El botón «+ Nuevo proyecto» solo lo ve y usa el Consultor; sin servicio de IA queda deshabilitado con el texto visible «Requiere IA real (ejecutar la app en tu equipo)». (2) El formulario pide nombre de la empresa (obligatorio, 2 a 80 caracteres, sin saltos de línea, único entre todos los proyectos sin distinguir mayúsculas) y sector (opcional, hasta 60 caracteres), con errores claros y accesibles, y el aviso «El proyecto se guarda solo en este navegador. Los documentos se procesan con IA real (OpenAI).». (3) El proyecto nuevo nace en Evidencia, Pendiente, 0 %, rotulado «Creado por ti» (no «(ejemplo)»), con id `N-<n>`. (4) Un proyecto nuevo solo trabaja en modo IA real; el modo Simulado queda deshabilitado con «El modo Simulado solo está disponible en los proyectos de ejemplo»; nunca se mezcla una estrategia simulada (AG-029). (5) El flujo completo (evidencia, diagnóstico real, revisión, emisión, calificación del Líder, estrategia real, informes) funciona, y el proyecto aparece en el tablero del Líder con su nota de mezcla simulado/real. (6) Los proyectos creados se conservan entre recargas (campo opcional `createdProjects` dentro de v3, sin subir la versión) y «Restablecer demo» MUST pedir confirmación explícita diciendo que borra los proyectos creados. (7) El nombre de la empresa es un DATO: se muestra siempre como texto, y al agente le llega escapado, delimitado y con tope de longitud, igual que el contenido de los documentos; una instrucción dentro del nombre no se obedece. (8) Editar o borrar proyectos individuales queda fuera de alcance (hoja de ruta).
- **AG-033** *(P2, lote H, solo presentación)*: La interfaz MUST mostrar la madurez, los hallazgos y la revisión con una capa visual **aditiva**, sin cambiar reglas de dominio, verificación, persistencia ni roles. (1) Madurez por dimensión como barras horizontales (escala 1 a 5, marca en 2) dibujadas con CSS propio y sin librerías nuevas; por debajo de 2 usan el color de alerta de los tokens **y** la etiqueta «Bajo (<2)»; «Sin evidencia suficiente» y «Sin respaldo vigente» se dibujan como barra vacía rayada con esa etiqueta y **nunca con un número**; junto a cada barra, «basado en N hallazgos». (2) Tarjeta del nivel general «N de 5» con barra de 5 segmentos, rotulada «estimado por IA» (real) o «ilustrativo, ficticio» (simulado); sin índice: «—» y «Sin evidencia suficiente». (3) Hallazgos como tarjetas con chip de pilar, chip de estado (las categorías que ya existen) y la cita en una caja gris con archivo y ubicación. (4) Cifras y barra segmentada del estado de la revisión en Diagnóstico y Revisión. (5) Tablero del Líder: cifras y barras de promedio por pilar, con la nota de mezcla cuando corresponda. (6) Chips «Deriva de» en la Estrategia real con los ids existentes. El color nunca es el único dato (todo lleva texto, también en blanco y negro al imprimir), los colores y espacios salen de los tokens, y la Empresa no ve datos técnicos. No incluye radar, matriz de priorización, chat ni feed de actividad, y no cambia el contenido de la traza. **AG-033 modifica FR-057 (c), «Sin promedio por pilar», y la exclusión «Promedio por pilar (barras)» de la 001 solo para los proyectos reales con diagnóstico emitido** (punto 5): el tablero muestra el promedio por pilar únicamente con los niveles con respaldo vigente de esos proyectos y lo rotula «estimado por IA»; los proyectos simulados no tienen nivel por pilar (FR-058: no existe dato por pilar) y no entran en ese promedio, y con los datos de ejemplo todo sigue igual: **la sección «Madurez por pilar (promedio)» no existe en el tablero (ni siquiera en el DOM) mientras no haya al menos un proyecto real con diagnóstico emitido**; cuando aparece, lleva el rótulo «estimado por IA» y el tablero conserva su nota de mezcla. Es el mismo tipo de modificación que hizo AG-031 con FR-058.
- **AG-034** *(P2, lote H2, solo presentación)*: La aplicación MUST presentarse como un tablero armónico, sin cambiar reglas de dominio, verificación, índice, roles ni persistencia. (a) Barra lateral de color primario con texto blanco y elemento activo en píldora blanca; la barra superior se integra con ella y conserva sus controles; en móvil se conserva el comportamiento actual. (b) Encabezados con etiqueta en mayúsculas encima, título grande y empresa en peso ligero; el texto accesible de los `h1` no cambia. (c) Escala tipográfica y espaciado en múltiplos de 8, tarjetas con radio y sombra suave y texto secundario con contraste AA. (d) Tarjetas de cifras en cuadrícula uniforme, de alturas iguales y sin huérfanas, la primera en color primario. (e) Chips de estado consistentes (verde, ámbar, gris, rojo), siempre con texto. (f) Transiciones cortas y elevación al pasar el cursor, desactivadas con `prefers-reduced-motion`. **Madurez en modo real**: tarjeta del nivel general como pieza principal y una lista compacta de 6 barras con una sola escala 1–5; el índice y cada valor aparecen una sola vez; «Sin evidencia» se dice una vez, con barra rayada y sin número; la justificación y «Deriva de» van en un detalle. **Rótulo de IA**: el principio III y AG-023 exigen «Generado por IA · requiere revisión humana» en todo contenido del modelo; en los bloques de madurez y de estrategia el rótulo MUST ir visible y unido al encabezado del bloque (no repetido por fila), y cada hallazgo conserva el suyo. Hallazgos en cuadrícula de igual altura; citas como fuente (no como botones salvo que sean interactivas); la decisión elegida (Aceptar, Editar, Rechazar) se ve inequívoca con relleno e indicador además del texto. Estrategia real: riesgos y fases como tarjetas con chips y las fases como línea de tiempo por horizonte. Proyectos: tarjetas de igual altura y alineadas. Se corrige «Calificación de el diagnóstico» por «del». Sin librerías nuevas; las pantallas simuladas solo cambian por CSS y envoltorios aditivos.

### Entidades clave

- **Corrida del agente**: una ejecución de una etapa (diagnóstico, estrategia o crítico) con su modelo, tokens, errores y resultado (completo o parcial).
- **Traza**: lista ordenada de pasos de una corrida (herramienta, consulta, verificaciones fallidas y su resolución); visible solo para roles internos (AG-009).
- **Documento fuente**: archivo cargado por la persona; su texto extraído existe solo durante la sesión.
- **Cita**: referencia literal a un documento fuente con archivo, ubicación y fragmento; tiene estado verificada o no.
- **Hallazgo real**: igual que el de la 001, pero con citas «Extracto de tu archivo» y rótulo «Generado por IA · requiere revisión humana».
- **Objeción**: observación del Crítico asociada a un hallazgo; no cambia su estado.
- **Nivel de madurez** *(AG-031)*: por dimensión, `{ dimensión, nivel 1 a 5 o «sin evidencia suficiente», justificación, ids de los hallazgos de los que deriva }`, propuesto por el agente; **no se revisa por separado**: su respaldo vigente depende de las decisiones sobre los hallazgos. El **índice global** no es una entidad guardada: lo calcula el código.
- **Ficha técnica** *(AG-023)*: bloque del informe para roles internos con modelo, fecha y tokens de cada corrida.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-A1**: El 100 % de los hallazgos mostrados como verificados tiene su cita literal presente en la fuente (prueba automática).
- **SC-A2**: Cero claves en el repositorio y en los archivos publicados (verificación automática del proyecto).
- **SC-A3** *(modificado 2026-11-14)*: El 100 % de las corridas guarda su traza, su modelo y sus tokens, y los muestra (plegados) a Consultor y Líder; la Empresa no ve ninguno.
- **SC-A4**: Ningún elemento de la estrategia real aparece sin hallazgo aceptado y verificado; SC-012 de la 001 sigue vigente.
- **SC-A5**: El modo Simulado pasa todas las pruebas de la 001 sin cambios.
- **SC-A6**: La corrida completa del diagnóstico cabe en el tiempo de una demostración. **NO VERIFICADO**: meta por medir; no se fija un número hasta tener mediciones reales.
- **SC-A7**: Tras recargar la página con el servicio local en ejecución, la persona vuelve a ejecutar el agente sin recargar archivos.
- **SC-A8** *(nuevo 2026-11-14)*: El 100 % de los niveles de madurez mostrados con número cita al menos un hallazgo aceptado o editado y verificado, muestra «basado en N hallazgos» con el N correcto, y el índice mostrado coincide con el cálculo por código a partir de esos niveles (prueba automática que recorre todos los niveles, más una comprobación por mutación: un nivel sin hallazgos verificados hace fallar una prueba).
- **SC-A9** *(nuevo 2026-11-14)*: Ningún rótulo visible de contenido de IA contiene el nombre del modelo, y la Empresa no ve en ninguna pantalla ni en el informe la traza, el modelo, la fecha de corrida, los tokens ni la ficha técnica (prueba por rol en 320, 768 y 1280 px).

## Supuestos

- La persona ejecuta el servicio local en su equipo y dispone de su propia clave del proveedor; sin ella solo funciona el modo Simulado.
- Los documentos que carga en modo «IA real» son suyos y puede enviarlos al proveedor; el aviso previo (AG-004) lo deja explícito.
- El proveedor es OpenAI (decisión de la persona responsable, constitución 2.0.0 en adelante); los modelos por etapa se fijan en la planificación, no aquí.
- Las seis dimensiones («pilares») y el flujo de revisión, emisión, calificación e informe son los de la 001 y no cambian, salvo lo que AG-031 añade (niveles de madurez e índice calculados por código, sin cambiar `reviewProgress` ni `canIssue`) y los ajustes de presentación de AG-009, AG-021 y AG-023.
- La calidad de los hallazgos de la IA real **NO VERIFICADO**: la función garantiza que las citas existen en la fuente, no que las conclusiones sean correctas; por eso siempre requiere revisión humana.
- El tiempo de ejecución y el costo por corrida **NO VERIFICADO**: se medirán, no se prometen.
- Los casos de evidencia agregada después de emitir se resuelven con la regla de solo lectura de la 001; si se quisiera re-ejecutar, sería una decisión nueva.
- **Cambio de supuesto de la 001 (lote N)**: en la 001 los proyectos son ejemplos precargados y fijos (P-A a P-D del Equipo 1 y E-1 a E-3). Desde el lote N el Consultor puede crear proyectos propios (`N-<n>`, Equipo 1, solo IA real); los 7 de ejemplo y sus pruebas no cambian.
- Toda la documentación y la interfaz están en español (constitución, restricciones adicionales).
