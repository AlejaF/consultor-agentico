# Cobertura de las interfaces de referencia

Fecha: 2026-11-01; actualizado el 2026-11-02 tras los lotes L6f y L6g (informe imprimible, recuento de NO VERIFICADO, vista de la Empresa, análisis de sector y mercado, documentos sugeridos y ampliación del tablero). Solo documentación: no cambia el comportamiento de la demo.

## Resumen de conteos

Cuenta cada fila de las dos tablas siguientes por su estado (el «Incluido (con mejoras)» cuenta como Incluido). Tras la decisión del 2026-11-02 no queda ninguna fila «provisional».

| Referencia | Incluido | Simplificado | Excluido por decisión | No tratado | Total |
|---|---|---|---|---|---|
| Estudiantes → Consultor | 5 | 7 | 1 | 1 | 14 |
| Profesorado → Líder y Empresa | 3 | 9 | 7 | 2 | 21 |
| **Total** | 8 | 16 | 8 | 3 | 35 |

Cambios del lote L6g respecto de L6f: el inicio de la Empresa, el formulario de datos, el informe, el buscador, los indicadores y la tabla del tablero cambiaron de estado como indican sus filas. Las 6 brechas, con su estado, están al final.

## Decisión sobre P3 (2026-11-02)

Por decisión de la persona responsable, el 2026-11-02 **se incluyen L5a (informe imprimible) y L5b (vista de la Empresa y encuesta simulada)**, y las piezas **E** (tablero del Líder ampliado), **F** (datos de la empresa; la lista de documentos sugeridos se retiró el 2026-11-02) y **G** (análisis de sector y mercado de solo lectura) **amplían el alcance de P3**. Por eso ya no hay filas «provisional»: las que lo eran pasaron a «Simplificado».

## Cómo se hizo (y qué es verificado y qué es supuesto)

- **Referencias**: los dos documentos de la carpeta local `referencias/` (no se publica ni se versiona). Cada uno es una secuencia de pantallas en imagen (5 la de estudiantes y 7 la de profesorado). Se extrajeron las imágenes incrustadas a una carpeta temporal fuera del repositorio y se miraron una por una. **Verificado**: lo que se ve en esas imágenes. **Supuesto**: cualquier comportamiento que una imagen fija no puede mostrar (filtros, búsquedas, qué hace cada botón); se marca como «supuesto».
- **Demo**: «verificado» significa que lo comprueban pruebas automáticas o las capturas de `docs/evidencia/` de este repositorio; «supuesto» significa que lo afirmo por lectura del código o del spec sin una prueba que lo cubra.
- **Sin copiar nada**: este documento describe las pantallas con palabras propias; no reproduce textos, nombres, marcas ni cifras de las referencias.
- **Estados**: **Incluido**; **Simplificado** (se indica cómo); **Excluido por decisión** (se cita el requisito del spec o `docs/decisiones.md`); **No tratado** (no hay decisión registrada; no se decidió ni a favor ni en contra).

## Referencia de estudiantes → rol Consultor

| Pantalla o elemento de la referencia | Estado | Qué hace la demo / decisión | Verificación |
|---|---|---|---|
| Lista de proyectos con tarjetas (fase, estado, avance, última actualización, enlace al proyecto) | **Simplificado** | Tarjetas con etapa, estado, avance en tercios, última actividad y, si hay, estado de las entregas (FR-049, decisiones de L2). | Verificado: `matrix.spec.ts`, capturas `L2/proyectos-*` |
| Buscador de empresas y filtro «todas las fases» en la lista | **No tratado** | No hay decisión registrada; con 4 proyectos no se construyó. | Verificado que no existe (código de `Projects.tsx`) |
| Botón «nuevo proyecto» | **Excluido por decisión** | spec, «Fuera de la demo»: administración de la plataforma, creación de proyectos nuevos. | Verificado que no existe |
| Barra lateral con cuatro secciones (proyectos, diagnóstico, estrategia, revisión) | **Simplificado** | Navegación por rol (FR-049): «Proyectos» y, dentro de un proyecto, los cuatro pasos con su estado en texto; bajo 1024 px, barra de pestañas. | Verificado: `nav.spec.ts`, `tabs.spec.ts` |
| Identificación de la persona al pie de la barra | **Simplificado** | Se reemplazó por el selector «Rol activo» y «Restablecer demo» en la cabecera (FR-006, FR-051; `docs/decisiones.md`, L6b). | Verificado: `l6b.spec.ts` |
| Captura: preguntas de diagnóstico (desplegables y texto libre) | **Incluido** | Cinco preguntas de ejemplo, guardadas en el navegador. | Verificado: `evidence.spec.ts` |
| Captura: lista de entrevistas con estados «transcrito» y «procesando» | **Simplificado** | Lista de evidencia con entrevistas y transcripciones de ejemplo y el estado «Procesando» simulado en las pendientes. El **audio** queda fuera (spec, «Formatos» y «Fuera de la demo»). | Verificado: `evidence.spec.ts` |
| Captura: lista de documentos con estado (hoja de cálculo, PDF, DOCX) | **Simplificado** | Documentos con tipo legible; los archivos propios se rotulan «Cargado localmente · no analizado»; no se leen (spec, FR-010 a FR-012). | Verificado: `evidence.spec.ts` |
| Panel «progreso de captura» y botón de generar el reporte | **Incluido** | Progreso por preguntas y archivos; «Generar diagnóstico» bloqueado con motivo si no hay evidencia (FR-015). | Verificado: `evidence.spec.ts` |
| Reporte de diagnóstico: tarjetas de índice de madurez, hallazgos identificados, evidencia citada y dimensiones evaluadas | **Simplificado** | Índice de madurez y «N de M hallazgos con evidencia citada»; no hay tarjetas separadas de «hallazgos identificados» ni de «dimensiones evaluadas». | Verificado: `p1-journey.spec.ts` |
| Hallazgos agrupados por dimensión, cada uno con su evidencia citada | **Incluido** (con mejoras) | Ocho hallazgos en seis pilares rotulados «Pilar: …»; la cita se puede abrir y muestra un extracto ficticio; marca «NO VERIFICADO» donde falta respaldo (FR-016 a FR-018). | Verificado: `ajustes.spec.ts`, `p1-journey.spec.ts` |
| Estado «generado, pendiente de revisión» y acciones «ir a la estrategia» y «enviar a revisión» en el reporte | **Simplificado** | El reporte ofrece «Ir a la revisión»; la emisión se hace en el panel de revisión, y «Enviar a revisión» pertenece a la estrategia. | Verificado: `ajustes.spec.ts`, `strategy-leader.spec.ts` |
| Estrategia: análisis de sector, riesgos con nivel, análisis de mercado, ruta por fases con horizonte | **Incluido** | La plantilla tiene cuatro riesgos y cuatro fases, pero **cada elemento se muestra solo si deriva de al menos un hallazgo aceptado o editado y verificado**: pueden verse 4 riesgos o menos (ver «Cuántos riesgos se ven: 3 o 4»). Análisis de sector y de mercado de solo lectura: resumen, 3 puntos clave, «Implicación para esta empresa» derivada de hallazgos con «Deriva de…» y fuentes (ninguna en la demo); resumen y puntos clave marcados «NO VERIFICADO · contenido ilustrativo» (FR-024 a FR-027, L6g). | Verificado: `strategy.test.ts`, `strategy-leader.spec.ts` |
| Panel de revisión: aceptar, editar, rechazar; avance «N de M»; evidencia de respaldo al lado; aprobar y emitir | **Incluido** | Igual, con confirmación y diagnóstico emitido de solo lectura (FR-019 a FR-022). La evidencia se abre bajo el hallazgo en celular. | Verificado: `p1-journey.spec.ts` |

## Referencia de profesorado → rol Líder (y, en parte, rol Empresa)

Nota: la referencia de profesorado es una plataforma de administración de empresas, no una pantalla de calificación. La rúbrica del Líder y el tablero de entregas se añadieron por decisión del responsable (spec, «Divergencias entre las referencias y lo pedido»).

| Pantalla o elemento de la referencia | Estado | Qué hace la demo / decisión | Verificación |
|---|---|---|---|
| Tablero del superadministrador: cuatro indicadores (empresas activas, diagnósticos por revisar, madurez promedio, casos de uso aprobados) | **Simplificado** | Cuatro indicadores: equipos activos, entregas por revisar, promedio de calificaciones y **madurez promedio (de 5)**, esta última derivada del índice de los diagnósticos emitidos (FR-057, L6g). El indicador de casos de uso queda fuera (spec, «Fuera de la demo»: portafolio de casos de uso). | Verificado: `strategy-leader.spec.ts` |
| Tabla de empresas (sector, etapa, madurez, avance, última actividad, enlace) | **Simplificado** | Tabla de equipos con proyectos, etapa (solo Evidencia, Diagnóstico y Estrategia), avance, **madurez** (promedio de los diagnósticos emitidos; «—» si no hay), última actividad y entregas por revisar; se reorganiza en tarjetas bajo 640 px (FR-028, FR-057). Sin columna de sector. | Verificado: `matrix.spec.ts`, `strategy-leader.spec.ts` |
| Buscador de empresa | **Incluido** | Buscador «Buscar equipo o empresa» en el tablero del Líder, con etiqueta visible, teclado y «Sin resultados» (FR-057, L6g). | Verificado: `strategy-leader.spec.ts` |
| Cola de revisión de diagnósticos con aviso de «sin evidencia suficiente» y de «contradicciones» | **Simplificado** | Cola de entregas por revisar (diagnóstico o estrategia) con «Revisar». Cada entrega, y la pantalla de revisión, muestra cuántos hallazgos aceptados o editados están NO VERIFICADO (FR-053, L6f). No muestra contradicciones (**No tratado**). | Verificado: `strategy-leader.spec.ts`, `l6f-no-verificado.spec.ts` |
| Promedio por pilar (barras) | **Excluido por decisión** | spec, «Fuera de la demo»: analítica global de la plataforma. | Verificado que no existe |
| Invitar empresa | **Excluido por decisión** | spec, «Fuera de la demo»: cuentas reales, invitación de empresas y envío de correos. | Verificado que no existe |
| Secciones de administración de bancos de preguntas, metodología y analítica | **Excluido por decisión** | spec, «Fuera de la demo»: administración de la plataforma (bancos de preguntas, metodología, analítica global). | Verificado que no existen |
| Enlace para ver la plataforma como una empresa | **Simplificado** | Selector «Rol activo» (FR-002) que lleva al inicio del otro rol. | Verificado: `l6b.spec.ts` |
| Inicio de la empresa con ruta de adopción en cuatro pasos, próximo paso y actividad reciente | **Simplificado** | Inicio de la Empresa (historia 7, FR-034, L6g) con ruta de adopción en **tres** pasos (Documentos, Diagnóstico, Estrategia) derivados del estado real de P-B, próximo paso y actividad de ejemplo rotulada. | Verificado: `empresa.spec.ts` |
| Documentos y datos de la empresa: formulario (razón social, identificador fiscal, sector, tamaño, ciudad, sitio web) | **Simplificado** | Tarjeta de solo lectura «Datos de la empresa (ficticios)» con nombre, sector, tamaño, ciudad y sitio web inventados; sin identificador fiscal ni edición (alta y edición de empresas pertenece a la administración de la plataforma; FR-056, L6g). | Verificado: `evidence.spec.ts` |
| Documentos y datos de la empresa: zona de carga y tabla de documentos con estado | **Incluido** | Carga local de PDF, DOCX, TXT, VTT, SRT y XLSX (formatos que salen de las dos referencias) con lista y estado (FR-010). | Verificado: `evidence.spec.ts` |
| Documentos y datos de la empresa: lista de documentos sugeridos | **Excluido por decisión** | Se construyó y se **retiró el 2026-11-02**: la demo no lee el contenido de los archivos, no puede saber qué documento se subió y la lista induce a pensar que hay que subir esos nombres. El sistema real sí podrá hacerlo al leer los documentos. | Verificado que no existe (`evidence.spec.ts`) |
| Diagnóstico con roles y encuestas: tabla de roles por correo, estado de cada encuesta, reenvío, fecha límite | **Excluido por decisión** | spec, «Fuera de la demo»: envío de correos y recordatorios. Lo que sí se incluye es una encuesta simulada de 3 preguntas para la Empresa, guardada solo en el navegador (FR-036, L6g). | Verificado que no existe la tabla de roles; encuesta: `empresa.spec.ts` |
| Diagnóstico: los seis pilares como etiquetas | **Incluido** | Seis pilares con el rótulo «Pilar: …» (FR-016). | Verificado: `ajustes.spec.ts` |
| Diagnóstico: transcripciones de reuniones asociadas a roles | **Simplificado** | Las transcripciones se cargan como evidencia, sin asociarlas a roles. | Supuesto (por lectura del código; no hay prueba de que no se pueda asociar) |
| Diagnóstico: casilla de consentimiento de quienes asisten a las reuniones | **No tratado** | No hay decisión registrada; la demo avisa que los archivos no salen del navegador (FR-011). | Verificado que no existe |
| Informe de diagnóstico: nivel de madurez de 1 a 5 con descripción del nivel | **Simplificado** | Índice de madurez 2,4 de 5 sin descripción del nivel. | Verificado: `p1-journey.spec.ts` |
| Informe: gráfico radial, puntaje por pilar, tipificación de cada hallazgo (brecha, fortaleza, contradicción), recomendaciones prioritarias | **No tratado** | No hay decisión registrada. | Verificado que no existe |
| Informe: exportar a PDF y encabezado de «revisado por el consultor» | **Simplificado** | Informe de diagnóstico imprimible (historia 8, FR-044 a FR-048): se imprime o guarda como PDF con la función del navegador; lleva «DEMO · datos ficticios» en cada página, «Simulada», «NO VERIFICADO», la fecha de emisión y «Revisado por: Consultor Demo»; sin exportación a un archivo desde la aplicación. | Verificado: `report.spec.ts` (PDF en carta y A4, aviso en cada página); la impresión real queda para revisión humana (T071) |
| Estrategia conversacional por etapas (visión, objetivos, principios, oportunidades, resultados clave) | **Excluido por decisión** | spec, «Fuera de la demo»: estrategia conversacional con asistente. | Verificado que no existe |
| Portafolio de casos de uso: matriz de priorización, ficha, tabla | **Excluido por decisión** | spec, «Fuera de la demo»: portafolio de casos de uso. | Verificado que no existe |

## Cuántos riesgos se ven: 3 o 4

La plantilla de estrategia tiene **4 riesgos**; la pantalla muestra un riesgo solo si al menos uno de sus hallazgos de respaldo está **aceptado o editado y verificado** (FR-025). El hallazgo H5 es NO VERIFICADO, así que nunca respalda nada.

| Riesgo | Respaldo (hallazgos) | Se ve cuando… |
|---|---|---|
| R1 | H2, H1 | H1 o H2 está aceptado o editado |
| R2 | H4, H5 | **H4** está aceptado o editado (H5 no cuenta: NO VERIFICADO) |
| R3 | H7, H3 | H3 o H7 está aceptado o editado |
| R4 | H6 | H6 está aceptado o editado |

- **Salen 4 riesgos** cuando están aceptados o editados H6, H4, al menos uno de H1/H2 y al menos uno de H3/H7. Es el caso de P-C y de los equipos 2 y 3 (todos aceptados).
- **En P-B salen 3** (R1, R3 y R4) porque el estado de ejemplo **rechaza H4** y H5 es NO VERIFICADO: R2 se queda sin respaldo. Las 4 fases sí salen (F2 deriva de H2, que está editado; F3, de H3).
- El equipo con H8 rechazado (proyecto E-1) también ve 4 riesgos (H8 solo respalda la fase F4, que sigue saliendo por H7).
- La frase «cuatro riesgos» de la versión anterior de este documento era correcta para la plantilla, pero engañosa para P-B; se corrigió en la fila de Estrategia.

## Brechas que se podrían cerrar sin romper la constitución

Criterios: aportan al objetivo (diagnóstico y estrategia con revisión humana y rúbrica del Líder), usan solo datos ficticios y contenido estático (principios I y II), se rotulan como simulados cuando corresponde (principio III) y se escriben primero en el spec (principio VI). Los costos son **estimaciones NO VERIFICADO** de tiempo del agente, sin contar la revisión de la persona.

| # | Brecha | Por qué aporta | Costo estimado |
|---|---|---|---|
| 1 | **Hecha en L6f (FR-053).** Mostrar en la cola del Líder y en la entrega cuántos hallazgos están «NO VERIFICADO» (respaldo insuficiente). | Ayuda a calificar la honestidad del entregable; los datos ya existen. | ≈ 0,5 h |
| 2 | **Hecha en L6f (L5a, FR-044 a FR-048).** Informe imprimible (historia 8, ya especificada). | Permite llevar el resultado fuera de la pantalla. | ≈ 0,75 h (estimación del plan) |
| 3 | Puntaje por pilar y tipo de hallazgo (brecha, fortaleza o contradicción) en el reporte de diagnóstico. | Da una lectura por pilar y hace más útil la revisión; requiere datos ficticios nuevos y un requisito nuevo. | ≈ 1 a 1,5 h |
| 4 | Recomendaciones prioritarias derivadas de los hallazgos aceptados y verificados (con «Deriva de…», igual que la estrategia). | Conecta diagnóstico y estrategia con trazabilidad; reutiliza `deriveStrategy`. | ≈ 1 h |
| 5 | **Hecha en L6g (L5b, FR-034 a FR-036).** Vista de la Empresa con resumen y encuesta simulada (historia 7, ya especificada). | Completa el tercer punto de vista; hoy solo hay un mensaje. | ≈ 0,75 h (estimación del plan) |
| 6 | ~~Lista de «documentos sugeridos» en la captura de evidencia.~~ **Construida en L6g y retirada el 2026-11-02**: la demo no lee los archivos y no puede saber qué documento se subió; queda para el sistema real. | Orientaba qué evidencia reunir. | — |

No se recomiendan, por bajo valor frente a su costo en una demo de 4 a 7 proyectos: buscador y filtro por fase (≈ 0,5 h) y asociar transcripciones a roles. Todo lo demás de las referencias es parte del sistema completo.
