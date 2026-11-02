# Pruebas con usuarios (guion y tabla de resultados)

> **SC-001 y SC-005: NO VERIFICADO hasta completarla.** Este archivo es un guion y una tabla vacía. No contiene resultados: nadie ha hecho la prueba todavía. Con 2 o 3 participantes el resultado es **indicativo, no concluyente**: SC-005 («9 de cada 10») no puede comprobarse con esa muestra y se registra como «indicativo (n = …)».

## Antes de empezar

- Participantes: 2 o 3 personas que no hayan visto la demo. Se identifican solo como **P1, P2 y P3**. **No se recogen nombres, correos ni datos personales** (ni en este archivo ni en grabaciones).
- Consentimiento verbal, antes de empezar: «Voy a pedirte que pruebes una demostración con datos inventados. Lo que se evalúa es la demostración, no tú. Puedes parar cuando quieras. No voy a anotar tu nombre. ¿Estás de acuerdo?»
- Materiales: un navegador con la demo (`npm run preview` o la dirección publicada), un cronómetro y este guion. Antes de cada participante, «Restablecer demo».
- La persona que dirige la prueba **no ayuda** durante las tareas; anota qué ocurre y cuándo hubo dudas.

## Tareas (5)

| # | Tarea (se lee en voz alta) | Qué se observa |
|---|---|---|
| 1 | «Entra a la demo como Consultor.» | Si encuentra la cuenta y llega a Proyectos sin ayuda. |
| 2 | «Abre el proyecto de la Empresa Ficticia Alfa y agrega un archivo (hay uno de prueba en la mesa).» | Si encuentra la carga, si entiende que el archivo no sale de su equipo. |
| 3 | «Genera el diagnóstico, revisa los hallazgos (acepta, edita o rechaza) y emítelo.» | Tiempo hasta emitir (SC-001), errores, dudas sobre qué hacer con «NO VERIFICADO». |
| 4 | «Cambia al rol de Líder y califica una entrega.» | Si encuentra el cambio de rol y la rúbrica; si entiende «Guardar calificación». |
| 5 | «Para terminar: ¿qué partes de lo que viste eran simuladas o inventadas?» (sin pistas) | Qué partes nombra (diagnóstico, citas, estrategia, generación, datos de empresas, calificaciones de ejemplo…). Se registra si identifica lo simulado (SC-005). |

**Tiempo de la tarea 3 (SC-001)**: cronometrar desde que la persona entra como Consultor hasta que el diagnóstico queda «Emitido» (incluye cargar un archivo, generar y revisar). Meta del spec: 10 minutos o menos, **NO VERIFICADO** hasta medirse.

## Tabla de resultados (para completar)

| Participante | Tiempo hasta emitir (SC-001) | Errores o tropiezos | Comentarios | ¿Identificó lo simulado? (sí / en parte / no) |
|---|---|---|---|---|
| P1 | | | | |
| P2 | | | | |
| P3 | | | | |

## Cómo se resume (lo hace la persona, en T096)

- SC-001: se registra el tiempo observado de cada participante. Solo pasa a «verificado» si la tabla está completa y todos cumplen la meta con una muestra suficiente; con 2 o 3 participantes es **indicativo (n = …)**.
- SC-005: proporción de participantes que identificaron lo simulado, como **indicativo (n = …)**; nunca «cumplido» con esta muestra.
- Los problemas encontrados se anotan en la lista de pulido de `docs/decisiones.md`. Cualquier cambio de comportamiento se corrige primero en el spec.
