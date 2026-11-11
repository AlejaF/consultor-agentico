# Especificación de la función: Agente real con IA

**Rama de la función**: `002-agente-real` (no se creó rama; la persona responsable decide el control de versiones, principio VIII)

**Creada**: 2026-11-11

**Estado**: Borrador

**Entrada**: Especificación 002 «Agente real con IA». Extiende `specs/001-demo-consultor-agentico/spec.md` sin romperla. El modo Simulado de la 001 sigue funcionando igual y es lo que se publica en GitHub Pages.

**Gobierno**: Constitución 2.0.0 (principios I, II, III y IX en particular). Todo lo que no se haya podido comprobar se marca **NO VERIFICADO**.

## Contexto y alcance

El profesor pidió más «implementación accionable de la IA (agentes)» y el uso de una API de pago. Esta especificación añade un segundo modo de trabajo, **IA real**, junto al modo **Simulado** de la 001:

- **Simulado**: es el comportamiento actual de la 001, sin cambios. Es el único modo disponible en la versión publicada.
- **IA real**: solo existe cuando la persona ejecuta en su propio equipo un servicio local opcional. Ese servicio envía el texto de los documentos al proveedor de IA (OpenAI) para producir hallazgos con citas literales a los documentos de la persona.

**Dentro del alcance**: diagnóstico con agente real (US9), traza y verificación de citas (US10), estrategia con agente real (US11), información faltante (US12) y agente Crítico (US13, P3).

**Fuera del alcance**: audio (sigue fuera, como en la 001); despliegue público de la IA real; autenticación real; cualquier almacenamiento del texto completo de los documentos; cambios al modo Simulado.

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

---

### Historia 10 - Traza y verificación con retroalimentación visible (Prioridad: P1)

La persona ve la «Traza del agente»: cada herramienta que usó y con qué consulta, y cada verificación de cita que falló con la forma en que el agente la corrigió o la descartó. Una cita se considera verificada solo si el fragmento citado aparece literalmente en el texto fuente, ignorando diferencias de mayúsculas, tildes y espacios. Un hallazgo sin respaldo suficiente se marca NO VERIFICADO (igual que en la 001) y no respalda la estrategia.

**Por qué esta prioridad**: sin verificación y traza, el contenido de la IA no es confiable ni auditable. Es lo que distingue un agente de un resumen opaco y sostiene el principio III de la constitución.

**Prueba independiente**: ejecutar el agente sobre un documento conocido y comprobar que (a) la traza lista cada paso, (b) toda cita marcada como verificada se encuentra literalmente en el texto fuente y (c) una cita alterada a propósito se marca como fallida.

**Escenarios de aceptación**:

1. **Dado** una corrida terminada, **Cuando** la persona abre la «Traza del agente», **Entonces** ve cada herramienta usada, su consulta, el modelo utilizado, los tokens consumidos y los errores ocurridos.
2. **Dado** una cita cuyo fragmento no aparece en la fuente, **Cuando** el sistema la verifica, **Entonces** la traza registra el fallo y cómo se resolvió (corregida por el agente o descartada), y la cita nunca se muestra como verificada.
3. **Dado** un hallazgo sin ninguna cita verificada, **Cuando** se muestra, **Entonces** lleva «NO VERIFICADO» con la razón y, si está aceptado o editado, «No se usará como respaldo de la estrategia» (FR-018).
4. **Dado** una cita que coincide solo tras ignorar mayúsculas, tildes y espacios, **Cuando** se verifica, **Entonces** se considera verificada.

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

### Historia 12 - Información faltante (Prioridad: P2)

El agente lista qué evidencia habría hecho falta para respaldar mejor cada pilar. Es texto de salida; no crea flujos nuevos.

**Por qué esta prioridad**: ayuda a la persona a mejorar su evidencia, pero el flujo funciona sin ella.

**Prueba independiente**: ejecutar un diagnóstico real con evidencia escasa en un pilar y comprobar que aparece, para ese pilar, qué evidencia faltó, rotulada como generada por IA.

**Escenarios de aceptación**:

1. **Dado** un diagnóstico real, **Cuando** la persona lo abre, **Entonces** ve para cada pilar una lista de la evidencia faltante, rotulada «Generado por IA (modelo X) · requiere revisión humana».
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
- **AG-009**: El sistema MUST mostrar la «Traza del agente» de cada corrida: herramientas usadas con su consulta, verificaciones de cita fallidas y su resolución, modelo usado, tokens consumidos y errores.
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

- **AG-021** *(P2)*: El agente MUST listar, por pilar, la evidencia que habría hecho falta para respaldar mejor el diagnóstico, como texto de salida sin flujos nuevos.
- **AG-022** *(P3)*: El agente Crítico MUST revisar los hallazgos antes de que lleguen al Consultor y mostrar objeciones sobre los débiles o contradictorios; MUST NOT aceptar, rechazar ni editar hallazgos por sí mismo.

**Rotulado**

- **AG-023**: Todo contenido producido por el modelo MUST llevar el rótulo «Generado por IA (modelo X) · requiere revisión humana», con el modelo real en lugar de X. El rótulo «Simulada» se conserva solo para el modo Simulado.
- **AG-024**: Las citas reales MUST rotularse «Extracto de tu archivo» y MUST NOT llevar «Evidencia de ejemplo (ficticia)».

**Conservación y privacidad de datos**

- **AG-025**: Los hallazgos, los extractos citados, la traza resumida (modelo, tokens, errores), la información faltante y las objeciones del Crítico MUST conservarse entre recargas; el texto completo de los archivos MUST NOT conservarse en el navegador ni en disco. Puede mantenerse únicamente en la memoria del servicio local mientras este siga en ejecución (AG-026).
- **AG-026**: Ningún documento MUST guardarse en disco por el servicio local; el contenido vive solo en la memoria del servicio mientras este siga en ejecución.

**Modo por proyecto**

- **AG-029**: El modo (Simulado o IA real) MUST quedar fijado por proyecto desde que se genera su diagnóstico; MUST NOT mezclarse hallazgos simulados y reales en un mismo proyecto. Cambiar de modo MUST exigir un proyecto nuevo o limpiar el diagnóstico, y el sistema MUST explicarlo a la persona.

- **AG-030**: Si la persona recarga la página y el servicio local sigue en ejecución, el sistema MUST mostrar de nuevo los archivos ya cargados (nombre, tipo y estado de extracción) y MUST permitir volver a ejecutar el agente sin volver a cargarlos. Si el servicio se reinició o se cerró, MUST avisar qué archivos hay que volver a cargar.

**Seguridad**

- **AG-027**: Ninguna clave del proveedor MUST aparecer en el repositorio, su historial, la interfaz ni los archivos publicados, y la verificación automática del proyecto MUST fallar si encuentra una (principio IX).
- **AG-028**: Todo aviso de privacidad MUST nombrar al proveedor al que se envía el texto.

### Entidades clave

- **Corrida del agente**: una ejecución de una etapa (diagnóstico, estrategia o crítico) con su modelo, tokens, errores y resultado (completo o parcial).
- **Traza**: lista ordenada de pasos de una corrida (herramienta, consulta, verificaciones fallidas y su resolución).
- **Documento fuente**: archivo cargado por la persona; su texto extraído existe solo durante la sesión.
- **Cita**: referencia literal a un documento fuente con archivo, ubicación y fragmento; tiene estado verificada o no.
- **Hallazgo real**: igual que el de la 001, pero con citas «Extracto de tu archivo» y rótulo de IA.
- **Objeción**: observación del Crítico asociada a un hallazgo; no cambia su estado.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-A1**: El 100 % de los hallazgos mostrados como verificados tiene su cita literal presente en la fuente (prueba automática).
- **SC-A2**: Cero claves en el repositorio y en los archivos publicados (verificación automática del proyecto).
- **SC-A3**: El 100 % de las corridas muestra su traza, su modelo y sus tokens.
- **SC-A4**: Ningún elemento de la estrategia real aparece sin hallazgo aceptado y verificado; SC-012 de la 001 sigue vigente.
- **SC-A5**: El modo Simulado pasa todas las pruebas de la 001 sin cambios.
- **SC-A6**: La corrida completa del diagnóstico cabe en el tiempo de una demostración. **NO VERIFICADO**: meta por medir; no se fija un número hasta tener mediciones reales.
- **SC-A7**: Tras recargar la página con el servicio local en ejecución, la persona vuelve a ejecutar el agente sin recargar archivos.

## Supuestos

- La persona ejecuta el servicio local en su equipo y dispone de su propia clave del proveedor; sin ella solo funciona el modo Simulado.
- Los documentos que carga en modo «IA real» son suyos y puede enviarlos al proveedor; el aviso previo (AG-004) lo deja explícito.
- El proveedor es OpenAI (decisión de la persona responsable, constitución 2.0.0); los modelos por etapa se fijan en la planificación, no aquí.
- Las seis dimensiones («pilares») y el flujo de revisión, emisión, calificación e informe son los de la 001 y no cambian.
- La calidad de los hallazgos de la IA real **NO VERIFICADO**: la función garantiza que las citas existen en la fuente, no que las conclusiones sean correctas; por eso siempre requiere revisión humana.
- El tiempo de ejecución y el costo por corrida **NO VERIFICADO**: se medirán, no se prometen.
- Los casos de evidencia agregada después de emitir se resuelven con la regla de solo lectura de la 001; si se quisiera re-ejecutar, sería una decisión nueva.
- Toda la documentación y la interfaz están en español (constitución, restricciones adicionales).
