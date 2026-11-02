# Feature Specification: DEMO navegable Consultor Agéntico (Evidencia → Diagnóstico → Estrategia)

**Feature Branch**: `001-demo-consultor-agentico` (sin rama creada: no hay extensión de git activa; la carpeta del spec es independiente de la rama)

**Created**: 2026-11-01

**Updated**: 2026-11-01 (decisiones del responsable: alcance solo Evidencia → Diagnóstico → Estrategia, rúbrica de 1 a 5, «Guardar calificación», informe imprimible; tras el análisis de consistencia: botón «Generar estrategia», rótulo de citas, respaldo verificado, nombre de archivo de hasta 150 caracteres, paleta verificada y tipografía aproximada)

**Status**: Draft

**Input**: User description: "UNA sola aplicación web responsive que une las dos interfaces de referencia (estudiantes y profesorado) con acceso por rol (Consultor, Líder, Contacto de la empresa), para recorrer el flujo Evidencia → Diagnóstico → Estrategia. Prototipo navegable para probar con usuarios, publicado como sitio estático; lo que dependa de IA o de servidor se simula y se rotula «simulada»."

> **Rótulo de la DEMO**: toda pantalla indica que es una demostración con datos ficticios. Todo contenido que en el sistema completo produciría una IA o un servidor se rotula **«Simulada»**. Lo que no pudo comprobarse se rotula **NO VERIFICADO** (constitución, principios I, II y III).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ingresar por rol y recorrer la demo con orientación (Priority: P1)

Una persona que prueba la demo abre la aplicación, ve de inmediato que es una demostración con datos ficticios, elige uno de los tres roles (Consultor, Líder, Contacto de la empresa) con una cuenta ficticia y llega a la pantalla de inicio propia de ese rol. En cualquier momento puede cambiar de rol con un selector visible, sin perder lo ya hecho.

**Why this priority**: sin ingreso por rol no hay forma de recorrer el flujo ni de probar los demás roles. Es la puerta de entrada de toda la demo.

**Independent Test**: abrir la aplicación sin ninguna preparación, elegir cada rol y comprobar que cada uno muestra únicamente su navegación y su pantalla de inicio, con el aviso de demo visible.

**Acceptance Scenarios**:

1. **Given** la aplicación recién abierta, **When** la persona la visualiza, **Then** ve el aviso «DEMO · datos ficticios» y las tres cuentas de demostración rotuladas como ficticias, sin pedir contraseña ni datos personales.
2. **Given** la pantalla de ingreso, **When** elige «Consultor», **Then** llega a la lista de proyectos del consultor y ve solo opciones de ese rol.
3. **Given** una sesión de Consultor con trabajo en curso, **When** usa el selector de rol y elige «Líder», **Then** pasa a la vista del líder y, al volver a «Consultor», encuentra su trabajo intacto.
4. **Given** un Consultor, **When** intenta abrir directamente una dirección de una vista del Líder, **Then** la aplicación lo lleva a su propia pantalla de inicio con un mensaje que explica que esa vista pertenece a otro rol.
5. **Given** cualquier rol, **When** pide «Restablecer demo» (botón de la cabecera), **Then** tras una confirmación todo el progreso vuelve al estado inicial de demostración.
6. **Given** cualquier rol, **When** elige «Inicio» (o la marca) en la cabecera, **Then** ve la pantalla de ingreso sin que se borre su progreso, y al elegir una cuenta entra a su pantalla de inicio.

---

### User Story 2 - Cargar evidencia local con aviso de privacidad (Priority: P1)

La persona con rol Consultor entra a un proyecto ficticio y llega a «Captura de evidencia»: responde preguntas de diagnóstico, y agrega archivos (documentos y transcripciones) desde su equipo. Antes de cargar, la pantalla le avisa que **los archivos nunca salen de su navegador**, que se listan pero **no se analizan** en la demo, y que el análisis de la demo usa evidencia de ejemplo ficticia. Ve el progreso de captura (preguntas, entrevistas, documentos).

**Why this priority**: es el primer paso del flujo y el punto donde la confianza y la privacidad se ganan o se pierden; sin evidencia no hay diagnóstico.

**Independent Test**: con un proyecto abierto, cargar un archivo válido y uno no válido y comprobar la lista, los mensajes, el aviso de privacidad y que no existe ninguna transferencia de los archivos fuera del navegador.

**Acceptance Scenarios**:

1. **Given** la pantalla de captura de evidencia, **When** se abre, **Then** se muestra de forma permanente el aviso: «Tus archivos se quedan en este navegador; no se envían a ningún servidor. En esta demo no se analizan».
2. **Given** un archivo de tipo y tamaño permitidos, **When** la persona lo agrega (arrastrando o con el botón de selección), **Then** aparece en la lista con nombre, tipo, tamaño y el estado «Cargado localmente · no analizado».
3. **Given** un archivo de tipo no permitido, vacío, que excede el tamaño máximo o con un nombre de más de 150 caracteres, **When** la persona lo agrega, **Then** no se añade a la lista y se explica el motivo y los formatos permitidos, sin perder los demás archivos de la misma selección.
4. **Given** un archivo ya cargado, **When** la persona lo quita, **Then** desaparece de la lista y del progreso de captura, tras una confirmación.
5. **Given** un proyecto con evidencia de ejemplo y archivos propios, **When** se observa la lista, **Then** se distinguen visualmente la evidencia de ejemplo (ficticia) de los archivos cargados localmente.
6. **Given** archivos propios cargados, **When** la persona recarga la página o vuelve más tarde, **Then** siguen listados con nombre, tipo y tamaño y con la nota «Contenido no conservado en esta demo», y su contenido no puede abrirse.

---

### User Story 3 - Diagnóstico simulado con citas a la evidencia (Priority: P1)

Con evidencia disponible, el Consultor pide «Generar diagnóstico» y recibe un reporte rotulado **Simulado**: índice de madurez, hallazgos agrupados por dimensión y, en cada hallazgo, al menos una cita a la evidencia (qué documento o entrevista y en qué punto). Puede abrir cada cita y ver el extracto ficticio que la respalda.

**Why this priority**: es el centro del flujo que se quiere validar y la fuente de todo lo que sigue.

**Independent Test**: generar el diagnóstico de un proyecto con evidencia y comprobar que todos los hallazgos tienen cita abrible, que el rótulo «Simulada» está presente y que un proyecto sin evidencia no permite generarlo.

**Acceptance Scenarios**:

1. **Given** un proyecto con al menos un elemento de evidencia, **When** el Consultor pide «Generar diagnóstico», **Then** aparece un indicador de progreso simulado y luego el reporte con el estado «Generado — pendiente de revisión» y el rótulo «Simulada».
2. **Given** el reporte generado, **When** se examina cada hallazgo, **Then** todos muestran al menos una cita con nombre del elemento de evidencia y su ubicación (minuto, página o pregunta) y el contador «con evidencia citada» es coherente con lo que se ve.
3. **Given** un hallazgo, **When** la persona activa su cita, **Then** se muestra el extracto ficticio respaldatorio y toda cita lleva el rótulo «Evidencia de ejemplo (ficticia)».
4. **Given** un proyecto sin ningún elemento de evidencia, **When** se abre «Generar diagnóstico», **Then** la acción está deshabilitada con la explicación «Carga al menos un archivo» y un enlace a la captura de evidencia.
5. **Given** un hallazgo marcado con evidencia insuficiente, **When** se muestra, **Then** lleva la marca «NO VERIFICADO» y la explicación de por qué.

---

### User Story 4 - Revisar y aprobar el diagnóstico (Priority: P1)

El Consultor revisa cada hallazgo en un panel de revisión con la evidencia de respaldo a un lado: puede **aceptar**, **editar** o **rechazar** cada uno, ve cuántos lleva revisados y, cuando termina, **aprueba y emite** el diagnóstico. Lo emitido queda con estado «Emitido» y fecha, y conserva las decisiones tomadas. El Líder no aprueba ni bloquea el diagnóstico: solo lo califica después, y el Consultor puede continuar con la estrategia sin esperar su calificación.

**Why this priority**: es la garantía humana del flujo (la IA propone, la persona decide) y habilita la estrategia y la calificación.

**Independent Test**: revisar todos los hallazgos con una mezcla de aceptar, editar y rechazar, aprobar, y comprobar el estado final, el conteo y que lo rechazado no figura como aceptado.

**Acceptance Scenarios**:

1. **Given** un diagnóstico generado, **When** el Consultor abre «Revisión», **Then** ve los hallazgos con las acciones Aceptar, Editar y Rechazar y el avance «N de M hallazgos revisados».
2. **Given** un hallazgo seleccionado, **When** se selecciona, **Then** el panel lateral muestra sus citas y extractos.
3. **Given** un hallazgo, **When** el Consultor lo edita y guarda, **Then** el texto nuevo reemplaza al anterior, queda marcado «Editado por consultor» y conserva sus citas.
4. **Given** un texto de edición vacío, **When** intenta guardar, **Then** se impide y se explica el motivo.
5. **Given** hallazgos aún sin revisar, **When** intenta «Aprobar y emitir», **Then** la acción queda impedida y se indica cuántos faltan.
6. **Given** todos los hallazgos revisados y al menos uno aceptado o editado, **When** aprueba y emite, **Then** el diagnóstico pasa a «Emitido», se registra la fecha y los hallazgos rechazados quedan marcados como excluidos; la ventana de confirmación aclara que el Líder podrá revisarlo y calificarlo después y que no se necesita su aprobación para continuar con la estrategia.
9. **Given** un diagnóstico recién emitido, **When** se muestra el banner «Emitido», **Then** dice que el Líder podrá calificarlo cuando quiera, que no bloquea el trabajo, y ofrece un botón destacado «Continuar con la Estrategia →» que lleva a esa pantalla; en la navegación el paso Estrategia pasa de «Pendiente» a «Disponible».
7. **Given** que todos los hallazgos fueron rechazados, **When** intenta aprobar, **Then** se impide y se explica que debe haber al menos un hallazgo aceptado o editado.
8. **Given** un diagnóstico ya emitido, **When** se abre de nuevo, **Then** es de solo lectura.

---

### User Story 5 - Estrategia derivada del diagnóstico emitido (Priority: P2)

Cuando el diagnóstico está emitido, el Consultor pulsa «Generar estrategia» (una simulación de 1,5 s rotulada **Simulada**, disponible solo con el diagnóstico emitido) y recibe una «Propuesta de estrategia»: riesgos principales con nivel, ruta sugerida por fases con horizonte en meses, y análisis de sector y de mercado. Cada elemento indica de qué hallazgos del diagnóstico emitido deriva. Antes de emitir el diagnóstico, la estrategia no está disponible. La estrategia pasa por los estados «Sin generar» → «Generada» → «Enviada».

**Why this priority**: completa el flujo Evidencia → Diagnóstico → Estrategia, pero depende de que lo anterior exista.

**Independent Test**: con un diagnóstico emitido que tiene hallazgos aceptados, rechazados y uno aceptado pero NO VERIFICADO, pulsar «Generar estrategia» y comprobar la trazabilidad y que nada deriva de hallazgos rechazados ni de los NO VERIFICADO.

**Acceptance Scenarios**:

1. **Given** un diagnóstico aún no emitido, **When** el Consultor abre «Estrategia», **Then** ve un bloqueo que explica que requiere diagnóstico emitido y un enlace al paso que corresponde («Ir al diagnóstico» si aún no se generó; «Ir a la revisión» si está generado y sin emitir), y el botón «Generar estrategia» no está disponible.
2. **Given** un diagnóstico emitido y una estrategia sin generar, **When** el Consultor abre «Estrategia», **Then** ve el botón «Generar estrategia» y todavía no ve contenido de estrategia.
3. **Given** el botón «Generar estrategia», **When** lo pulsa, **Then** aparece un indicador de 1,5 s rotulado «Simulada», luego riesgos, ruta sugerida y análisis con el rótulo «Simulada» y el estado «Generada»; pulsarlo dos veces no genera dos estrategias.
4. **Given** la estrategia generada, **When** se examina cada riesgo y cada paso de la ruta, **Then** cada uno muestra «Deriva de: [hallazgos]» y la lista incluye solo hallazgos aceptados o editados **y verificados**.
5. **Given** un hallazgo aceptado con la marca «NO VERIFICADO», **When** se genera la estrategia, **Then** no cuenta como respaldo: no aparece en ningún «Deriva de» y un elemento cuyo único respaldo sería ese hallazgo no se muestra; si ningún elemento tiene respaldo, se muestra un aviso en lugar de contenido.
6. **Given** los análisis de sector y de mercado, **When** se muestran, **Then** llevan la marca «NO VERIFICADO · contenido ilustrativo» porque no se respaldan con fuentes.
7. **Given** la estrategia generada, **When** el Consultor elige «Enviar a revisión», **Then** el estado pasa a «Enviada al Líder» y aparece en la cola de entregas del Líder.

---

### User Story 6 - Tablero del Líder: revisar, calificar con rúbrica y guardar la calificación (Priority: P2)

La persona con rol Líder ve un tablero de los equipos ficticios (etapa, avance, última actividad, entregas por revisar), abre una entrega (diagnóstico emitido o estrategia enviada), consulta su contenido y citas en solo lectura, la califica con una rúbrica de 4 criterios de ejemplo (pendientes de definir por el profesor), con niveles de 1 a 5, puede escribir comentarios (opcionales) y usa «Guardar calificación». El Líder califica la calidad del entregable: no aprueba ni edita su contenido, y en la demo no existe devolución para corrección. El Consultor ve la calificación y los comentarios en su proyecto.

**Why this priority**: cierra el ciclo docente y permite probar la perspectiva del profesorado; depende de que existan entregas.

**Independent Test**: con una entrega pendiente, calificar todos los criterios, guardar la calificación (con o sin comentario), cambiar a Consultor y comprobar que la ve y que su diagnóstico sigue emitido.

**Acceptance Scenarios**:

1. **Given** el tablero del Líder, **When** se abre, **Then** muestra indicadores (equipos activos, entregas por revisar, promedio de calificaciones), la tabla de equipos y la cola de revisión, todo con datos ficticios.
2. **Given** la cola de revisión, **When** el Líder elige «Revisar» en una entrega, **Then** ve el contenido de la entrega en solo lectura, con citas que se pueden abrir, y la rúbrica rotulada «Criterios de ejemplo (pendientes de definir por el profesor)».
3. **Given** una rúbrica con 4 criterios, **When** el Líder deja algún criterio sin nivel, **Then** «Guardar calificación» está impedido y se indica qué falta («Elige un nivel de 1 a 5 en los 4 criterios. El comentario es opcional.»); no escribir comentario no lo impide.
4. **Given** todos los criterios con un nivel de 1 a 5 (con o sin comentario), **When** el Líder usa «Guardar calificación», **Then** la entrega pasa a «Calificada», se muestra el promedio de los criterios en formato 1,0 a 5,0 con coma decimal junto a «Meta del programa (ilustrativa): 4,2 de 5», y la entrega sale de la cola.
5. **Given** una entrega calificada, **When** el Consultor abre su proyecto, **Then** ve el puntaje por criterio y los comentarios del Líder (o «Sin comentario» si no escribió ninguno), sin poder modificarlos.
6. **Given** una entrega ya calificada, **When** el Líder la reabre, **Then** la ve en solo lectura.
7. **Given** equipos de ejemplo precargados, **When** el Líder los consulta, **Then** puede abrir y calificar sus entregas precargadas sin haber ejecutado antes el flujo del Consultor.
8. **Given** una calificación guardada, **When** se consulta el estado del proyecto, **Then** el diagnóstico sigue «Emitido» y la estrategia sigue disponible: la calificación no bloquea ni deshace la emisión, y no se ofrece devolver el entregable para corregirlo.

---

### User Story 7 - Vista del Contacto de la empresa y encuesta simulada (Priority: P3)

La persona con rol Contacto de la empresa ve el resumen del proyecto de su empresa ficticia (etapa actual, avance por fase, próximo paso, actividad reciente) y responde una encuesta simulada. Cuando el diagnóstico está emitido, también ve un resumen de resultados.

**Why this priority**: aporta el tercer punto de vista pero no es necesario para validar el flujo principal; es lo primero que se corta dentro de P3 si falta tiempo (orden de corte dentro de P3: 1.º vista del Contacto, 2.º informe imprimible).

**Independent Test**: ingresar como Contacto, ver el resumen y completar la encuesta; comprobar que queda registrada y que se dice que es simulada.

**Acceptance Scenarios**:

1. **Given** el rol Contacto de la empresa, **When** ingresa, **Then** ve el resumen de un único proyecto de empresa ficticia con etapa, avance y próximo paso, sin ver herramientas del Consultor ni del Líder.
2. **Given** el resumen, **When** el diagnóstico del proyecto está emitido, **Then** el Contacto ve el índice de madurez y los hallazgos aceptados o editados con su texto preparado en lenguaje no técnico (el texto editado por el Consultor no se muestra al Contacto), rotulados «Simulada».
3. **Given** la encuesta simulada, **When** el Contacto responde todas las preguntas obligatorias y envía, **Then** ve la confirmación «Respuesta registrada (simulada); no se envió a nadie» y la actividad aparece en el resumen.
4. **Given** preguntas obligatorias sin responder, **When** intenta enviar, **Then** se impide y se señalan las preguntas faltantes.
5. **Given** que ya envió la encuesta, **When** vuelve, **Then** ve sus respuestas en solo lectura.
6. **Given** que la vista del Contacto de la empresa aún no está disponible en la demo, **When** ingresa con ese rol, **Then** ve el mensaje «Esta vista es para la persona de la empresa cliente que recibe el informe. Aún no está disponible en esta demostración.», sin menús vacíos ni enlaces rotos.

---

### User Story 8 - Informe imprimible del diagnóstico y la estrategia (Priority: P3)

La persona con rol Consultor, o el Líder al revisar una entrega, abre una vista de informe del diagnóstico emitido y de la estrategia, pensada para imprimirse o guardarse como PDF desde el navegador y llevarse a una sesión de validación. Conserva los rótulos «Simulada» y «NO VERIFICADO» y el aviso de demo.

**Why this priority**: es un extra aprobado que facilita validar la demo fuera de la pantalla, pero no es necesario para recorrer el flujo; es lo último que se corta dentro de P3 (orden de corte: 1.º vista del Contacto, 2.º informe imprimible).

**Independent Test**: con un diagnóstico emitido y una estrategia generada, abrir el informe, imprimirlo o guardarlo como PDF y comprobar que contiene lo emitido con todos los rótulos y sin controles de la aplicación.

**Acceptance Scenarios**:

1. **Given** un diagnóstico emitido, **When** el Consultor elige «Ver informe imprimible», **Then** ve un informe con encabezado «DEMO · datos ficticios», fecha de emisión, índice de madurez y los hallazgos, y con la estrategia a continuación si ya fue generada.
2. **Given** el informe, **When** se examina, **Then** incluye solo los hallazgos aceptados o editados con sus citas y extractos ficticios, marca como «NO VERIFICADO» los que lo son, e indica cuántos hallazgos fueron excluidos sin mostrarlos.
3. **Given** un diagnóstico aún no emitido, **When** se intenta abrir el informe, **Then** no está disponible y se explica que requiere un diagnóstico emitido, con un enlace a la revisión.
4. **Given** un diagnóstico emitido sin estrategia generada, **When** se abre el informe, **Then** contiene solo el diagnóstico y una nota «Estrategia aún no disponible».
5. **Given** el informe abierto, **When** la persona pide imprimir o guardar como PDF, **Then** se abre la función de impresión del navegador y el resultado omite la navegación y los controles, y mantiene legibles en blanco y negro los rótulos «Simulada», «NO VERIFICADO» y «DEMO · datos ficticios».
6. **Given** el Líder con una entrega abierta, **When** elige «Ver informe imprimible», **Then** ve el informe de esa entrega: si es una entrega de diagnóstico (`dx`), incluye solo el diagnóstico; si es una entrega de estrategia (`st`), incluye la estrategia enviada con su diagnóstico; nunca incluye una estrategia generada pero no enviada, y no incluye calificación ni comentarios.

---

### Edge Cases

- **Archivo no válido**: formato no permitido, archivo vacío, tamaño mayor al máximo, nombre repetido, nombre de más de 150 caracteres, o varios archivos de los que solo algunos son válidos; en cada caso se informa el motivo y se aceptan los válidos.
- **Sin evidencia**: proyecto sin ningún elemento de evidencia → no se puede generar diagnóstico y se orienta a cargar evidencia. Si se quitan todos los archivos propios, la evidencia de ejemplo sigue disponible según el proyecto.
- **Cambio de rol a mitad de flujo**: con una edición sin guardar o una revisión a medias, cambiar de rol conserva el progreso guardado y avisa si hay un cambio sin guardar; la vista de otro rol nunca expone herramientas del rol anterior.
- **Pantalla pequeña**: en un ancho de 320 px todo el contenido es legible y operable sin desplazamiento horizontal; la navegación del rol pasa a una barra de pestañas visible bajo la cabecera (FR-049); las tablas se reorganizan; el panel de evidencia queda debajo del hallazgo; los cinco niveles de cada criterio de la rúbrica quedan en una sola fila, de 44 px cada uno; y la cabecera ocupa como máximo dos filas, sin ocultar la etiqueta visible «Rol activo»; y un puntaje como «Calificada · 4,8 de 5» no se parte en dos líneas.
- **Navegación solo con teclado**: todas las acciones (incluida la carga de archivos sin arrastrar, aceptar/editar/rechazar, calificar con la rúbrica) se logran con teclado, con foco visible, orden lógico y un salto directo al contenido; los mensajes de error se anuncian a tecnologías de apoyo.
- **Recarga o cierre del navegador**: el progreso se conserva, pero de los archivos propios solo se conservan nombre, tipo y tamaño; su contenido no se conserva y tras recargar siguen listados con la nota «Contenido no conservado en esta demo». Si el navegador no permite guardar, la demo sigue funcionando durante la sesión y avisa que el progreso no se conservará.
- **Datos locales borrados**: la demo vuelve al estado inicial sin errores.
- **Evidencia agregada tras emitir**: el diagnóstico emitido no cambia; se avisa que la nueva evidencia no se refleja en él.
- **Intentar saltarse el orden**: abrir estrategia sin diagnóstico emitido, o aprobar con hallazgos sin revisar, está impedido y explicado.
- **Doble envío**: guardar una calificación, enviar una encuesta o enviar una estrategia dos veces no genera duplicados.
- **Calificación y emisión**: guardar una calificación nunca bloquea ni deshace la emisión del diagnóstico por el Consultor.
- **Informe muy largo**: al imprimirse, el informe se reparte en páginas sin perder el encabezado de demo ni los rótulos.
- **Contenido muy largo**: textos largos de edición o comentarios no rompen el diseño.

## Quién hace qué

| Rol | Qué hace |
|---|---|
| Consultor | Revisa cada hallazgo y aprueba y emite; es la supervisión humana sobre lo que propone la IA. |
| Líder | Califica la calidad del entregable con la rúbrica y lo guarda con comentarios opcionales; no aprueba ni edita contenido. |
| Contacto de la empresa | Consulta resultados y responde la encuesta. |

> En la demo los tres roles comparten el mismo navegador para que una sola persona recorra el ciclo completo; en el sistema completo cada rol tiene su propia sesión.

## Requirements *(mandatory)*

### Functional Requirements

**Ingreso, roles y rótulos (P1)**

- **FR-001**: El sistema MUST ofrecer una pantalla de ingreso con tres cuentas de demostración ficticias, una por rol (Consultor, Líder, Contacto de la empresa), sin contraseña ni datos personales reales. Cada cuenta es **una sola tarjeta que funciona como único control de entrada** (sin botones anidados): toda la tarjeta es el área táctil, con foco y paso del puntero visibles, y «Entrar →» como texto indicativo; su nombre accesible incluye «Entrar como <rol>» y el nombre de la cuenta. La pantalla de ingreso también se puede ver con un rol activo (por «Inicio») sin borrar el estado: al elegir una cuenta se entra a su pantalla de inicio.
- **FR-002**: El sistema MUST mostrar en todas las pantallas (salvo el ingreso) un selector de rol visible que permita cambiar de rol sin perder el progreso guardado. Al cambiar de rol con el selector, la aplicación MUST ir a la **pantalla de inicio del nuevo rol** (no a la pantalla actual, que puede no existir para ese rol) y conservar todo el estado; si hay una edición sin guardar, MUST pedir confirmación antes de cambiar.
- **FR-003**: El sistema MUST mostrar a cada rol solo su navegación y sus vistas, y redirigir con un mensaje explicativo cuando se intente abrir una vista de otro rol.
- **FR-004**: El sistema MUST mostrar en todas las pantallas el aviso «DEMO · datos ficticios».
- **FR-005**: El sistema MUST rotular «Simulada» todo contenido que en el sistema completo produciría una IA o un servidor, y «NO VERIFICADO» todo contenido o cifra que no pueda comprobarse.
- **FR-006**: El sistema MUST conservar el progreso entre recargas en el mismo navegador y MUST ofrecer «Restablecer demo» con confirmación, como **un único botón siempre visible en el encabezado** (no en la navegación). Al pulsarlo MUST pedir una sola confirmación breve en un diálogo accesible (foco atrapado, Escape y «Cancelar»): «¿Restablecer la demo? Se borrarán tus cambios en este navegador.»; al confirmar, restablece y vuelve al ingreso. Si a 320 px no cabe el texto completo, MUST mostrar «Restablecer» con nombre accesible «Restablecer demo». De los archivos propios MUST conservar solo nombre, tipo y tamaño; su contenido MUST NOT conservarse, y tras recargar siguen listados con la nota «Contenido no conservado en esta demo».
- **FR-007**: El sistema MUST seguir funcionando durante la sesión si no puede conservar el progreso, y avisar de ello.

**Evidencia (P1)**

- **FR-008**: El sistema MUST ofrecer, por proyecto, una pantalla de captura con preguntas de diagnóstico, lista de entrevistas/transcripciones, lista de documentos y un panel de progreso de captura.
- **FR-009**: El sistema MUST permitir agregar archivos desde el equipo tanto arrastrando como mediante un botón de selección operable con teclado.
- **FR-010**: El sistema MUST aceptar solo documentos y transcripciones en los formatos y tamaño máximo indicados en la pantalla (formatos: PDF, DOCX, TXT, VTT, SRT y XLSX; máximo 25 MB por archivo; nombre de archivo de hasta 150 caracteres) y rechazar con explicación los vacíos, los no permitidos, los demasiado grandes y los de nombre más largo que 150 caracteres.
- **FR-011**: Los archivos agregados MUST permanecer únicamente en el navegador de la persona y nunca transmitirse a un servidor; el sistema MUST decirlo antes y durante la carga.
- **FR-012**: El sistema MUST rotular los archivos propios como «Cargado localmente · no analizado», añadir la nota «Contenido no conservado en esta demo» cuando tras recargar su contenido ya no esté disponible, y distinguirlos de la evidencia de ejemplo ficticia.
- **FR-013**: El sistema MUST permitir quitar archivos propios, con confirmación.
- **FR-014**: El sistema MUST incluir proyectos ficticios precargados con evidencia de ejemplo, y al menos uno sin evidencia.

**Diagnóstico (P1)**

- **FR-015**: El sistema MUST permitir «Generar diagnóstico» solo cuando el proyecto tenga al menos un elemento de evidencia, y explicar el bloqueo si no lo tiene.
- **FR-016**: El sistema MUST producir un diagnóstico simulado a partir de contenido preparado, con índice de madurez, hallazgos agrupados por dimensión (seis dimensiones) y el rótulo «Simulada». Cada grupo MUST rotularse «Pilar: <nombre>» (por ejemplo «Pilar: Estrategia») en Diagnóstico, Revisión, informe y Estrategia, para no confundir el pilar «Estrategia» con la etapa «Estrategia».
- **FR-017**: Cada hallazgo MUST incluir al menos una cita que identifique el elemento de evidencia y su ubicación, y MUST poder abrirse para mostrar un extracto ficticio. Toda cita MUST rotularse «Evidencia de ejemplo (ficticia)», incluso en un proyecto cuya lista de evidencia no muestre ese elemento.
- **FR-018**: Todo hallazgo con respaldo insuficiente MUST marcarse «NO VERIFICADO» con la razón. Cuando un hallazgo NO VERIFICADO esté aceptado o editado, MUST mostrarse junto a él «No se usará como respaldo de la estrategia».
- **FR-019**: El sistema MUST ofrecer un panel de revisión con Aceptar, Editar y Rechazar por hallazgo, la evidencia de respaldo junto al hallazgo seleccionado y el avance «N de M hallazgos revisados».
- **FR-020**: El sistema MUST impedir guardar una edición vacía.
- **FR-021**: El sistema MUST permitir «Aprobar y emitir» solo con todos los hallazgos revisados y al menos uno aceptado o editado; el diagnóstico emitido MUST quedar de solo lectura, con estado y fecha, y los rechazados MUST quedar marcados como excluidos. La ventana «¿Aprobar y emitir el diagnóstico?» MUST decir: «El Líder podrá revisarlo y calificarlo después; no necesitas su aprobación para continuar con la estrategia.» Ningún texto de la interfaz MUST sugerir que el Líder aprueba o desbloquea algo.
- **FR-022**: El sistema MUST crear, al emitir el diagnóstico, una entrega visible para el Líder. El banner del diagnóstico emitido MUST decir «El Líder podrá calificarlo cuando quiera. No bloquea tu trabajo: puedes continuar con la estrategia.» y MUST ofrecer el botón destacado «Continuar con la Estrategia →», que lleva a la pantalla de Estrategia.

**Estrategia (P2)**

- **FR-023**: El sistema MUST bloquear la estrategia mientras el diagnóstico no esté emitido, con explicación y un enlace cuyo destino depende del estado del proyecto: sin diagnóstico generado, «Ir al diagnóstico»; con el diagnóstico generado y sin emitir, «Ir a la revisión» (nunca un enlace a una pantalla que a su vez está bloqueada).
- **FR-024**: El sistema MUST ofrecer un botón «Generar estrategia», disponible solo con el diagnóstico emitido, que tras una simulación de 1,5 s rotulada «Simulada» produzca una estrategia simulada con riesgos (con nivel), ruta sugerida por fases con horizonte y análisis de sector y de mercado; la estrategia pasa por los estados sin generar, generada y enviada, y generar dos veces no la duplica.
- **FR-025**: Cada riesgo y cada fase de la ruta MUST indicar los hallazgos de los que deriva. Como respaldo solo cuentan los hallazgos aceptados o editados **y verificados**; un hallazgo aceptado pero «NO VERIFICADO» MUST NOT contarse como respaldo ni aparecer en «Deriva de», y un elemento sin ningún hallazgo de respaldo MUST NOT mostrarse. La pantalla de Estrategia MUST mostrar la línea «N hallazgos aceptados no se usaron como respaldo porque están NO VERIFICADO» (con concordancia de número) solo cuando N > 0.
- **FR-026**: Los análisis de sector y de mercado MUST llevar la marca «NO VERIFICADO · contenido ilustrativo».
- **FR-027**: El sistema MUST permitir «Enviar a revisión» la estrategia generada, creando una entrega para el Líder, sin duplicar si se pulsa más de una vez.

**Líder (P2)**

- **FR-028**: El sistema MUST ofrecer al Líder un tablero con indicadores (incluido el promedio de calificaciones en formato 1,0 a 5,0), tabla de equipos (etapa, avance, última actividad; las etapas son solo Evidencia, Diagnóstico y Estrategia) y cola de revisión, con equipos ficticios precargados.
- **FR-029**: El sistema MUST permitir al Líder abrir una entrega en solo lectura, con sus citas que se pueden abrir.
- **FR-030**: El sistema MUST ofrecer una rúbrica de 4 criterios con niveles de 1 a 5 por criterio (los cinco niveles de un criterio MUST verse en una sola fila, de al menos 44 px cada uno, desde 320 px), visible antes de calificar y rotulada en pantalla «Criterios de ejemplo (pendientes de definir por el profesor)»; el Líder MUST asignar un nivel a cada criterio antes de poder usar «Guardar calificación»; el comentario es opcional (hasta 2000 caracteres) y la ayuda dice «Elige un nivel de 1 a 5 en los 4 criterios. El comentario es opcional.».
- **FR-031**: Al usar «Guardar calificación», el sistema MUST calcular el puntaje total como el promedio de los niveles de los criterios (de 1 a 5), mostrarlo en formato 1,0 a 5,0 con coma decimal junto a «Meta del programa (ilustrativa): 4,2 de 5», marcar la entrega «Calificada», sacarla de la cola y volverla de solo lectura. La calificación MUST NOT bloquear ni deshacer la emisión del diagnóstico por el Consultor, y la demo MUST NOT ofrecer devolución para corrección.
- **FR-032**: El Consultor MUST poder ver, en su proyecto, el puntaje por criterio y los comentarios de las entregas calificadas, sin poder modificarlos; si no hay comentario, la vista de solo lectura MUST mostrar «Sin comentario» (sin dejar un espacio vacío).
- **FR-033**: Las entregas precargadas de equipos de ejemplo MUST poder calificarse sin que antes se haya ejecutado el flujo del Consultor.

**Contacto de la empresa (P3)**

- **FR-034**: El sistema MUST mostrar al Contacto el resumen del proyecto de una empresa ficticia (etapa, avance por las fases Evidencia, Diagnóstico y Estrategia, próximo paso, actividad reciente).
- **FR-035**: Cuando el diagnóstico del proyecto esté emitido, el sistema MUST mostrar al Contacto el índice de madurez y los hallazgos aceptados o editados con su texto preparado en lenguaje no técnico, rotulados «Simulada»; el texto editado por el Consultor no se muestra al Contacto.
- **FR-036**: El sistema MUST ofrecer una encuesta simulada con preguntas obligatorias; al enviar MUST confirmar que quedó registrada de forma simulada y que no se envió a nadie, y MUST mostrar las respuestas en solo lectura después.

**Calidad transversal (constitución)**

- **FR-037**: El sistema MUST ser plenamente usable en celular, tableta y computador, sin desplazamiento horizontal desde 320 px de ancho.
- **FR-038**: El sistema MUST cumplir WCAG 2.2 AA, incluidos contraste, foco visible, orden lógico, etiquetas en todos los controles y anuncio de errores y cambios de estado.
- **FR-039**: Todo elemento interactivo MUST tener un objetivo táctil de al menos 44 × 44 px.
- **FR-040**: Todas las acciones MUST poder completarse solo con teclado, incluido un salto directo al contenido principal y una alternativa a arrastrar y soltar.
- **FR-041**: La paleta MUST tomarse de las interfaces de referencia —verificada por muestreo de los píxeles de sus capturas y ajustada solo donde un par de colores no cumplía AA— y la tipografía MUST ser una aproximación visual a la de las referencias, **NO VERIFICADO** (los PDF son imágenes y no incluyen la fuente). Ambas MUST definirse en un único lugar de variables de diseño.
- **FR-042**: El sistema MUST usar únicamente datos, nombres, marcas y logos ficticios; MUST NOT reproducir los de los documentos de referencia, y en lugar de logos reales MUST usar un emblema genérico.
- **FR-043**: Los mensajes y textos MUST estar en español.

**Informe imprimible (P3)**

- **FR-044**: El sistema MUST ofrecer, al Consultor y al Líder (este último sobre la entrega que revisa), una vista de informe del diagnóstico emitido y de la estrategia, preparada para imprimirse o guardarse como PDF mediante la función de impresión del navegador. El informe de una entrega de diagnóstico (`dx`) MUST incluir solo el diagnóstico; el de una entrega de estrategia (`st`), la estrategia enviada con su diagnóstico; el informe de una entrega MUST NOT incluir nunca una estrategia generada pero no enviada.
- **FR-045**: El informe MUST estar disponible solo cuando el diagnóstico esté emitido; si la estrategia aún no se ha generado, MUST contener solo el diagnóstico con la nota «Estrategia aún no disponible».
- **FR-046**: El informe MUST incluir solo los hallazgos aceptados o editados con sus citas y extractos ficticios, MUST marcar «NO VERIFICADO» lo que lo sea, MUST indicar cuántos hallazgos fueron excluidos sin mostrarlos y MUST NOT incluir calificaciones ni comentarios del Líder.
- **FR-047**: Cada página del informe MUST llevar el aviso «DEMO · datos ficticios», y los rótulos «Simulada» y «NO VERIFICADO» MUST ser legibles en blanco y negro (con texto, no solo con color).
- **FR-048**: El informe MUST omitir la navegación y los controles de la aplicación, MUST poder abrirse y activarse solo con teclado, y su generación MUST ocurrir en el navegador sin enviar datos a ningún servidor.

**Navegación y textos (transversal)**

- **FR-049**: El sistema MUST ofrecer una navegación lateral por rol. En pantallas de menos de 1024 px, la navegación del rol MUST ser una barra de pestañas siempre visible bajo la cabecera (no un menú oculto), sin desplazamiento horizontal de la página desde 320 px (con etiquetas ajustadas o en dos líneas), con objetivos de al menos 44 px, foco visible, orden lógico y operable con teclado; la cabecera no tiene menú ni botón «Opciones». En la lista de proyectos del Consultor no hace falta barra de pestañas. Un elemento de navegación MUST aparecer solo cuando su pantalla existe. **Consultor**: «Proyectos» y, dentro de un proyecto, un bloque con el nombre de la empresa y los cuatro pasos del flujo en orden (Evidencia, Diagnóstico, Revisión, Estrategia), cada uno con su estado en texto (Pendiente, En curso, Completado, Bloqueado o Disponible); «Disponible» se aplica al paso Estrategia cuando el diagnóstico está emitido y la estrategia aún no se genera, en lugar de «Pendiente»; un paso bloqueado MUST llevar a su pantalla con la explicación del bloqueo, sin redirigir. **Líder**: «Tablero» y «Entregas por revisar (n)». **Contacto de la empresa**: «Resumen» y, cuando exista esa pantalla, «Encuesta»; mientras su vista no exista, el rol no muestra navegación y presenta un mensaje claro (sin menús vacíos ni enlaces rotos). La navegación MUST NOT incluir tarjeta de cuenta ni «Restablecer demo» (esa acción vive en la cabecera, FR-006). Cada lote añade a la navegación los elementos de sus pantallas.
- **FR-051**: El sistema MUST ofrecer una cabecera con: la marca «Consultor Agéntico» y un enlace visible «Inicio», ambos hacia la pantalla de ingreso **sin borrar el estado**; el selector «Rol activo» con su etiqueta visible; y el botón «Restablecer demo». A 320 px la cabecera MUST ocupar como máximo dos filas (fila 1: marca + «Inicio»; fila 2: «Rol activo» + «Restablecer»).
- **FR-050**: Los textos MUST concordar en número («1 archivo», «4 proyectos», «Se agregó 1 archivo», «No se agregaron 2 archivos») y MUST mostrar el tipo de archivo de forma legible («PDF · 47 B», no el tipo técnico). Los textos visibles para quien prueba la demo MUST estar en español natural y MUST NOT mencionar lotes ni fases internas de construcción.

### Key Entities *(include if feature involves data)*

- **Cuenta de demostración**: persona ficticia asociada a un rol; no tiene credenciales.
- **Rol**: Consultor, Líder o Contacto de la empresa; determina vistas y acciones permitidas.
- **Proyecto**: empresa ficticia, etapa actual (Evidencia, Diagnóstico, Estrategia), avance, estado y fecha de última actividad.
- **Equipo**: grupo ficticio de consultores asociado a uno o más proyectos; lo observa el Líder.
- **Elemento de evidencia**: documento, transcripción o entrevista; tiene origen (ejemplo ficticio o cargado localmente), tipo, tamaño y estado de análisis; de los archivos propios solo se conservan nombre, tipo y tamaño, no su contenido.
- **Pregunta de diagnóstico y respuesta**: dato de captura asociado al proyecto.
- **Diagnóstico**: índice de madurez, conjunto de hallazgos, estado (Generado, Emitido), fecha de emisión.
- **Hallazgo**: dimensión, texto, citas, marca NO VERIFICADO opcional, decisión (sin revisar, aceptado, editado, rechazado).
- **Cita**: referencia a un elemento de evidencia con su ubicación y un extracto ficticio.
- **Estrategia**: riesgos, ruta por fases, análisis de sector y mercado; cada elemento enlaza con los hallazgos de los que deriva; estado (Sin generar, Generada, Enviada); la calificación pertenece a la entrega, no a la estrategia.
- **Entrega**: diagnóstico emitido o estrategia enviada, sujeta a calificación; estado (Por revisar, Calificada).
- **Rúbrica y calificación**: 4 criterios de ejemplo (pendientes de definir por el profesor) con niveles de 1 a 5; calificación con nivel por criterio, promedio (1,0 a 5,0), meta ilustrativa del programa (4,2 de 5) y comentarios.
- **Informe imprimible**: vista del diagnóstico emitido y de la estrategia lista para imprimir; no es una entidad con datos propios.
- **Encuesta y respuesta**: preguntas dirigidas al Contacto y sus respuestas simuladas.

## Qué es simulado y qué es real

| Elemento | ¿Real o simulado? | Cómo se muestra |
|---|---|---|
| Ingreso por rol | Simulado: sin autenticación real | «Cuenta de demostración» |
| Control de acceso por rol | Simulado: ordena la experiencia, no protege datos | Aviso en la pantalla de ingreso |
| Diagnóstico, hallazgos, índice de madurez | Simulado: contenido preparado | Rótulo «Simulada» |
| Citas y extractos | Simulado: extractos ficticios preparados | «Evidencia de ejemplo (ficticia)» en toda cita |
| Análisis de sector y mercado | Simulado e ilustrativo | «NO VERIFICADO · contenido ilustrativo» |
| Estrategia | Simulada; la trazabilidad a los hallazgos aceptados sí se calcula con las decisiones reales de la persona | Rótulo «Simulada» |
| Generación del diagnóstico y de la estrategia («procesando…», 1,5 s) | Simulada | Indicador rotulado «Simulada» |
| Encuesta del Contacto, recordatorios, correos | Simulado: nada se envía | «Registrada (simulada); no se envió a nadie» |
| Carga de archivos | **Real, solo local**: el navegador lee el archivo para listarlo, no se analiza | Aviso de privacidad y «no analizado» |
| Contenido de los archivos tras recargar | **No se conserva**: solo se conservan nombre, tipo y tamaño | «Contenido no conservado en esta demo» |
| Decisiones de revisión (aceptar/editar/rechazar) y su efecto | **Real** dentro de la demo | — |
| Calificación con rúbrica, promedio y comentarios | **Real** dentro de la demo (lógica real; personas y datos ficticios; criterios de ejemplo) | «Criterios de ejemplo (pendientes de definir por el profesor)» |
| Meta del programa (4,2 de 5) | Cifra ilustrativa, sin respaldo (NO VERIFICADO) | «Meta del programa (ilustrativa)» |
| Informe imprimible | **Real** como formato de lo ya emitido; su contenido sigue siendo simulado | Mismos rótulos «Simulada» y «NO VERIFICADO» |
| Progreso conservado entre recargas (sin el contenido de los archivos propios) | **Real, solo local** | Aviso si no es posible |
| Equipos, empresas, cifras del tablero | Ficticios | «DEMO · datos ficticios» |

## Extras aprobados

Solo se aprobó un extra; entró al spec como historia P3 (historia 8) con los requisitos FR-044 a FR-048.

1. **Informe imprimible del diagnóstico y la estrategia**: vista lista para imprimir o guardar como PDF desde el navegador, con los rótulos «Simulada» y «NO VERIFICADO» incluidos. Valor: permite llevarse el resultado a una sesión de validación. Se corta en último lugar dentro de P3.

## Fuera de la demo (pertenece al sistema completo)

- IA real: análisis de documentos y transcripciones, generación de diagnóstico y estrategia, citas calculadas sobre la evidencia real del usuario.
- Transcripción de audio, lectura o procesamiento del contenido de los archivos cargados (incluidas las hojas de cálculo XLSX, que solo se listan).
- Cuentas reales, autenticación, permisos, invitación de empresas y envío de correos o recordatorios.
- Almacenamiento compartido entre personas o dispositivos, multiusuario y sincronización.
- Administración de la plataforma: bancos de preguntas, metodología, analítica global, alta y baja de empresas, creación de proyectos nuevos.
- Exportaciones oficiales, integraciones con terceros y conformidad legal sobre tratamiento de datos personales (**NO VERIFICADO**: no se ha evaluado).
- Fuentes reales para el análisis de sector y de mercado.
- Estrategia conversacional con asistente, construida por etapas (visión, objetivos, principios, oportunidades, OKRs): pertenece al sistema completo.
- Portafolio de casos de uso con matriz de priorización (impacto, complejidad, riesgo y estado) y cualquier gestión de casos de uso: pertenece al sistema completo.
- Devolución de un entregable al consultor para que lo corrija: en la demo la acción del Líder es «Guardar calificación» y no existe devolución para corrección.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona nueva completa, sin ayuda, el recorrido P1 completo del Consultor (ingresar, cargar evidencia, generar, revisar y emitir el diagnóstico) en 10 minutos o menos. *Meta por validar en pruebas con usuarios: NO VERIFICADO hasta medirse.*
- **SC-002**: El 100 % de los hallazgos del diagnóstico muestra al menos una cita abrible.
- **SC-003**: Durante todo el recorrido, 0 archivos de la persona salen del navegador, comprobable inspeccionando la actividad de red.
- **SC-004**: El 100 % de las pantallas con contenido simulado muestra el rótulo «Simulada» y el 100 % de las pantallas muestra el aviso de demo.
- **SC-005**: Al menos 9 de cada 10 participantes de las pruebas, preguntados al terminar, identifican correctamente qué partes eran simuladas. *Meta por validar: NO VERIFICADO hasta medirse; con una muestra de 2 o 3 personas el resultado solo puede registrarse como «indicativo (n = …)».*
- **SC-006**: Cada rol alcanza su pantalla de inicio en 3 interacciones o menos desde la apertura y puede cambiar de rol en 2 interacciones o menos.
- **SC-007**: El 100 % de los elementos interactivos tiene un objetivo táctil de al menos 44 × 44 px.
- **SC-008**: Ninguna pantalla requiere desplazamiento horizontal entre 320 y 1920 px de ancho, y las tareas P1 y P2 se completan en celular, tableta y computador.
- **SC-009**: Todas las tareas P1 y P2 se completan solo con teclado, y una revisión de accesibilidad automática más una manual no deja ningún incumplimiento de nivel AA de WCAG 2.2 sin resolver.
- **SC-010**: Una revisión del contenido (textos, datos, imágenes y archivos del repositorio) encuentra 0 nombres, marcas, logos o datos reales, y 0 archivos de `referencias/` incluidos.
- **SC-011**: Con una entrega pendiente, el Líder califica los 4 criterios y usa «Guardar calificación» en 5 minutos o menos y el Consultor ve el resultado en el siguiente ingreso a su proyecto, sin recargar la información a mano.
- **SC-012**: En el 100 % de los casos, ningún elemento de la estrategia cita como respaldo un hallazgo rechazado o «NO VERIFICADO», y ningún elemento se muestra sin al menos un hallazgo de respaldo aceptado o editado y verificado.
- **SC-013**: En el 100 % de las calificaciones guardadas, el promedio mostrado (formato 1,0 a 5,0 con coma decimal) coincide con el promedio de los niveles asignados, y ninguna calificación guardada cambia el estado «Emitido» del diagnóstico.
- **SC-014**: En el 100 % de las páginas del informe impreso aparecen «DEMO · datos ficticios» y los rótulos «Simulada» y «NO VERIFICADO» donde correspondan, legibles en blanco y negro.
- **SC-015**: Desde un diagnóstico emitido, la persona abre el informe imprimible en 2 interacciones o menos.

## Assumptions

- **Divergencias entre las referencias y lo pedido** (se resolvieron así; corrija si no es lo que se quería):
  - La referencia «profesorado» es en realidad una plataforma de administración con tablero de empresas, cola de revisión de diagnósticos, vista de empresa y otras secciones que no pertenecen a esta versión (ver «Fuera de la demo»). **No incluye calificación con rúbrica**; esa parte se define en este spec según lo pedido, con criterios y niveles propios (supuesto siguiente).
  - La referencia «estudiantes» ofrece captura de evidencia, reporte de diagnóstico, estrategia como propuesta (riesgos, mercado, ruta) y panel de revisión; esa es la base de los roles Consultor y, por derivación, de lo que ve el Contacto.
  - Las secciones de la referencia que exceden el flujo Evidencia → Diagnóstico → Estrategia quedan fuera de esta versión (ver «Fuera de la demo»).
- **Evidencia y citas**: dado que los archivos del usuario no se analizan, cada proyecto precargado incluye evidencia de ejemplo ficticia y las citas del diagnóstico simulado apuntan a esa evidencia de ejemplo. Los archivos propios cuentan como evidencia para habilitar la generación, pero no cambian su contenido. Un proyecto precargado sin evidencia sirve para probar el bloqueo; si la persona carga un archivo, se habilita la generación y el diagnóstico simulado cita evidencia de ejemplo, y cada cita se rotula «Evidencia de ejemplo (ficticia)» para que no se confunda con los archivos propios.
- **Rúbrica del Líder** (propuesta inicial, ajustable): 4 criterios (trazabilidad de la evidencia, calidad del análisis, coherencia entre diagnóstico y estrategia, claridad de la comunicación) con niveles de 1 a 5 por criterio; el puntaje total es el promedio de los criterios, con formato 1,0 a 5,0 y coma decimal, y se muestra junto a «Meta del programa (ilustrativa): 4,2 de 5». Los criterios se rotulan siempre «Criterios de ejemplo (pendientes de definir por el profesor)» y se muestran antes de calificar.
- **Avance de captura**: es (preguntas respondidas + un paso por tener al menos un elemento de evidencia) sobre el total de pasos (preguntas + 1).
- **Avance del proyecto**: se reparte en tres fases de un tercio cada una (Evidencia, Diagnóstico y Estrategia): la evidencia se completa con al menos un elemento, el diagnóstico al emitirse y la estrategia al enviarse. La etapa actual es la primera fase sin completar.
- **Evidencia en estado «Procesando»**: cuenta como elemento de evidencia para habilitar «Generar diagnóstico» (FR-015).
- **Nombres de equipos**: los equipos se llaman «Equipo 1» a «Equipo 4» (el del Consultor es «Equipo 1») para no confundirlos con las empresas ficticias «Empresa Ficticia Alfa», «Beta», «Gamma» y «Delta».
- **Entregas**: se generan dos tipos por proyecto, el diagnóstico emitido (automática al emitir) y la estrategia (al pulsar «Enviar a revisión»); cada una se califica por separado.
- **Aprobación del diagnóstico**: la hace el propio Consultor; el Líder no aprueba ni edita contenido, solo califica la calidad del entregable.
- **Alcance**: la demo cubre solo el flujo Evidencia → Diagnóstico → Estrategia (constitución, principio VII). Orden de corte dentro de P3, de lo primero a lo último: vista del Contacto, informe imprimible.
- **Usuarios y acceso**: una cuenta ficticia por rol, sin contraseña; el control por rol ordena la experiencia, no protege información.
- **Un solo navegador**: los tres roles comparten el mismo estado local del navegador, de modo que lo que el Consultor emite es lo que el Líder ve y califica y la calificación que el Consultor ve guardada.
- **Formatos**: se aceptan PDF, DOCX, TXT, VTT, SRT y XLSX hasta 25 MB. Los formatos salen de las **dos** referencias: PDF, DOCX, TXT, VTT y SRT de la de estudiantes y de la de profesorado, y XLSX porque la referencia de estudiantes muestra una hoja de cálculo como evidencia. Un XLSX se trata como documento y se rotula «Cargado localmente · no analizado», igual que los demás. El audio queda fuera: la referencia lo muestra ya transcrito, y esa transcripción es procesamiento del sistema completo.
- **Idioma**: toda la interfaz en español.
- **Dispositivos**: navegadores modernos actuales en celular, tableta y computador; sin soporte de navegadores antiguos.
- **Dimensiones y escala**: seis dimensiones (Estrategia, Infraestructura, Datos, Gobernanza, Talento, Cultura) y escala de 1 a 5, como términos genéricos; no se citan marcos ni fuentes reales.
- **Nombres**: los nombres de empresas, personas, instituciones y producto de las referencias (incluidos los que aparecen como ejemplo) se sustituyen por nombres inventados y evidentemente ficticios; el emblema y el logo reales se sustituyen por un emblema genérico.
- **Paleta y tipografía**: los colores se obtuvieron muestreando los píxeles de las capturas de las referencias; la tipografía es una aproximación NO VERIFICADO porque los PDF son imágenes sin la fuente incrustada.
- **Referencias**: los PDF de `referencias/` se usan solo como guía de diseño y flujo y no se incluyen en el repositorio.
