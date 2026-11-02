# Constitución de la DEMO Consultor Agéntico

## Principios Fundamentales

### I. Datos ficticios y rotulados
Todo dato, nombre, marca o logo es ficticio y se rotula como tal. MUST NOT aparecer datos,
nombres, marcas ni logos reales de empresas, personas o instituciones. Los PDF de `referencias/`
(`interfaz_estudiantes.pdf`, `interfaz_profe.pdf`) MUST NOT commitearse y permanecen en `.gitignore`.
Razón: el repositorio es público.

### II. Solo sitio estático
La demo es un sitio estático publicado en GitHub Pages. MUST NOT existir servidor, base de datos
ni claves de API. La IA se simula con contenido preparado y se rotula como simulada.
Razón: costo cero, publicación segura y sin secretos.

### III. Honestidad
Lo simulado MUST mostrarse como simulado. MUST NOT inventarse hechos. Lo que no se haya verificado
MUST marcarse NO VERIFICADO. Razón: el prototipo valida un flujo, no afirma resultados reales.

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

## Restricciones Adicionales

- Una sola aplicación web une las interfaces de estudiantes y profesorado, con acceso por rol.
- Toda salida simulada de IA MUST llevar un rótulo visible de "simulada".
- Las dependencias externas en tiempo de ejecución se evitan; si se usan, MUST funcionar sin
  claves ni servicios propios.
- Idioma de la interfaz, documentación y comunicación con el agente: español.

## Flujo de Desarrollo y Revisión

- Orden de trabajo: spec → plan → tareas → código, por lotes pequeños.
- Cada lote MUST pasar pruebas (incluida verificación de accesibilidad y de vistas responsive)
  antes de la revisión humana.
- La persona responsable revisa y hace el commit; el agente propone el mensaje, sin ejecutarlo.
- Toda revisión MUST verificar el cumplimiento de los principios I–VIII.

## Gobernanza

Esta constitución prevalece sobre otras prácticas del proyecto. Una enmienda MUST documentarse,
ser aprobada por la persona responsable y propagarse a spec, plan y tareas afectados.
El versionado es semántico: MAJOR por eliminar o redefinir principios de forma incompatible,
MINOR por añadir principios o ampliar guía de forma material, PATCH por aclaraciones. Toda
revisión de lote MUST comprobar el cumplimiento; cualquier excepción MUST justificarse por escrito.

**Version**: 1.0.1 | **Ratified**: 2026-11-01 | **Last Amended**: 2026-11-02

<!-- Enmienda 1.0.1 (PATCH, 2026-11-02): aclaración del principio VII (P3 puede incluirse o ampliarse por decisión escrita de la persona responsable). Aprobada por la persona responsable el 2026-11-02 al decidir incluir L5a y L5b y ampliar P3; propagada a spec.md, tasks.md, README.md, docs/decisiones.md y docs/cobertura-referencias.md. -->
