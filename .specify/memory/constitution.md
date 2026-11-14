# Constitución de la DEMO Consultor Agéntico

## Principios Fundamentales

### I. Datos ficticios y rotulados
Todo dato, nombre, marca o logo es ficticio y se rotula como tal. MUST NOT aparecer datos,
nombres, marcas ni logos reales de empresas, personas o instituciones. Los PDF de `referencias/`
(`interfaz_estudiantes.pdf`, `interfaz_profe.pdf`) MUST NOT commitearse y permanecen en `.gitignore`.
En modo IA real la persona puede cargar documentos propios; esos documentos MUST NOT
commitearse ni guardarse en disco por el backend (solo viven en memoria durante la sesión).
El repositorio, el sitio publicado y los archivos de ejemplo siguen siendo 100 % ficticios.
Razón: el repositorio es público y los documentos propios pueden ser confidenciales.

### II. Sitio estático publicado y backend local opcional
El sitio publicado en GitHub Pages sigue siendo estático y funciona solo en modo Simulado, con
contenido preparado rotulado como simulado. Se permite un backend local opcional (carpeta
`server/`) que solo corre en el equipo de la persona y es el único lugar donde puede existir la
clave de API del proveedor de IA (OpenAI). La clave MUST NOT aparecer en el repositorio, el
historial, el frontend ni `dist/`. MUST NOT desplegarse un backend con la clave de forma pública
sin autenticación y tope de gasto.
Razón: el sitio público no puede tener secretos; la IA real solo se ejecuta bajo control local.

### III. Honestidad
Lo simulado MUST mostrarse como simulado: el rótulo «Simulada» se conserva para el modo Simulado.
Todo contenido producido por el modelo MUST rotularse «Generado por IA · requiere revisión
humana», sin nombre de modelo. El modelo, la fecha y los tokens MUST guardarse en los datos y
mostrarse solo en la traza del agente y en la ficha técnica del informe, y solo a los roles
internos (Consultor y Líder), nunca a la Empresa. MUST NOT inventarse hechos. Lo que no se haya verificado MUST marcarse
NO VERIFICADO. Toda cita de un hallazgo MUST verificarse por código determinista contra el texto
fuente; una cita no verificada MUST NOT presentarse como verificada. Todo aviso de privacidad MUST
nombrar al proveedor al que se envía el texto.
Razón: el prototipo valida un flujo y el modelo puede equivocarse; la persona debe saberlo.

### IV. Responsive y accesible
La aplicación MUST funcionar en celular, tableta y computador, cumplir WCAG 2.2 AA, ofrecer
objetivos táctiles de al menos 44 px y poder usarse completamente con teclado.

### V. Diseño como tokens
La paleta y la tipografía MUST derivarse de las interfaces de referencia y definirse como
variables (tokens) en un único lugar. Los componentes MUST consumir tokens y MUST NOT fijar
colores ni fuentes directamente.

### VI. Especificación primero
Un cambio de comportamiento MUST empezar en el spec y propagarse al plan, a las tareas y al
código, en ese orden. MUST NOT cambiarse el código sin reflejarlo antes en el spec.

### VII. Alcance acotado
Todo requisito MUST tener prioridad P1, P2 o P3. Si falta tiempo, se corta desde P3. La persona responsable puede incluir o ampliar P3 por decisión escrita y registrada en el spec y en `docs/decisiones.md`; lo incluido sigue siendo P3 y recortable. Lo demás se
referencia como parte del sistema completo, que se construye aparte. La demo valida el flujo
Evidencia → Diagnóstico → Estrategia, con usuarios por rol.

### VIII. Revisión por lote
Cada lote MUST terminar con pruebas, revisión humana y un commit hecho por la persona
responsable. El agente MUST NOT hacer commit ni push.

### IX. Seguridad y costo de la IA
- La clave de API solo vive en `.env` (ignorado por git); `.env.example` MUST existir sin valores.
- `npm run check` MUST fallar si encuentra patrones de claves en el repositorio o en `dist/`.
- Todo bucle de agente MUST tener tope de iteraciones y de tamaño de entrada.
- El backend MUST escuchar solo en `127.0.0.1`.
- El contenido de los documentos MUST tratarse como datos, nunca como instrucciones.
- El agente propone y la persona decide (humano en el circuito).
- El modelo de cada etapa se configura por variable de entorno y MUST NOT cambiarse por defecto
  sin decisión registrada de la persona responsable.
Razón: limitar fugas de secretos, gasto no controlado e inyección de instrucciones.

## Restricciones Adicionales

- Una sola aplicación web une las interfaces de estudiantes y profesorado, con acceso por rol.
- Toda salida simulada de IA MUST llevar un rótulo visible de "simulada", y toda salida del
  modelo real el rótulo de generado por IA (principio III).
- El sitio publicado MUST funcionar sin claves ni servicios propios. Las dependencias externas en
  tiempo de ejecución se evitan; solo el backend local opcional (principio II) puede usar la clave
  del proveedor de IA, nunca el sitio publicado.
- Idioma de la interfaz, documentación y comunicación con el agente: español.

## Flujo de Desarrollo y Revisión

- Orden de trabajo: spec → plan → tareas → código, por lotes pequeños.
- Cada lote MUST pasar pruebas (incluida verificación de accesibilidad y de vistas responsive)
  antes de la revisión humana.
- La persona responsable revisa y hace el commit; el agente propone el mensaje, sin ejecutarlo.
- Toda revisión MUST verificar el cumplimiento de los principios I–IX.

## Gobernanza

Esta constitución prevalece sobre otras prácticas del proyecto. Una enmienda MUST documentarse,
ser aprobada por la persona responsable y propagarse a spec, plan y tareas afectados.
El versionado es semántico: MAJOR por eliminar o redefinir principios de forma incompatible,
MINOR por añadir principios o ampliar guía de forma material, PATCH por aclaraciones. Toda
revisión de lote MUST comprobar el cumplimiento; cualquier excepción MUST justificarse por escrito.

**Version**: 2.1.0 | **Ratified**: 2026-11-01 | **Last Amended**: 2026-11-14

<!-- Enmienda 1.0.1 (PATCH, 2026-11-02): aclaración del principio VII (P3 puede incluirse o ampliarse por decisión escrita de la persona responsable). Aprobada por la persona responsable el 2026-11-02 al decidir incluir L5a y L5b y ampliar P3; propagada a spec.md, tasks.md, README.md, docs/decisiones.md y docs/cobertura-referencias.md. -->

<!-- Enmienda 2.0.0 (MAJOR, 2026-11-11): redefinición incompatible del principio II («Solo sitio estático» → «Sitio estático publicado y backend local opcional»: ahora se permite un backend local con la clave de API). Principio I ampliado (documentos propios solo en memoria); principio III ampliado (rótulo de IA, verificación determinista de citas, proveedor en avisos de privacidad); nuevo principio IX «Seguridad y costo de la IA»; ajustadas «Restricciones adicionales» y la referencia I–IX. Principios IV–VIII sin cambios. Solicitada por la persona responsable el 2026-11-11; propagada a README.md y docs/decisiones.md. Pendiente propagar a spec.md, plan.md y tasks.md. -->

<!-- Enmienda 2.1.0 (MINOR, 2026-11-14): principio III. El rótulo de todo contenido del modelo pasa de «Generado por IA (modelo X) · requiere revisión humana» a «Generado por IA · requiere revisión humana», sin nombre de modelo; el modelo, la fecha y los tokens se guardan en los datos y se muestran solo en la traza del agente y en la ficha técnica del informe, solo a los roles internos (Consultor y Líder), nunca a la Empresa. Clasificación según la regla de gobernanza: MINOR, porque cambia el texto de un MUST y añade una regla por rol (amplía la guía de forma material), pero no elimina ni redefine el principio de forma incompatible (no es MAJOR) y no es una simple aclaración (no es PATCH). Razón: la Empresa no necesita el nombre técnico del modelo para saber que el contenido es de IA. Riesgo aceptado: quien mira un hallazgo suelto ya no ve el modelo; sigue disponible y auditable en la traza y la ficha técnica. Aprobada por la persona responsable el 2026-11-14; propagada a spec.md (AG-023), plan.md, tasks.md, README.md y docs/decisiones.md. La implementación del nuevo rótulo es el lote D3; hasta entonces el código conserva el rótulo con el modelo (desviación transitoria registrada en docs/decisiones.md). Principios I, II y IV–IX sin cambios. -->
