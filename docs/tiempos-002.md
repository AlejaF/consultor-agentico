# Registro de tiempo real de la especificación 002 «Agente real con IA»

Sirve para **calibrar** las estimaciones del plan ([`specs/002-agente-real/plan.md`](../specs/002-agente-real/plan.md), «Lotes y calendario»). Es tiempo de **reloj real**, no horas de desarrollador humano. Lo anota el agente al cerrar cada lote; la columna de revisión la completa la persona responsable.

**Definiciones**
- **(a) Generar código**: del inicio del lote hasta tener el código y las pruebas escritos, sin contar esperas largas.
- **(b) Esperas inevitables**: instalación de paquetes, ejecución de pruebas (unitarias, Playwright, suite completa) y corridas reales del modelo.
- **(c) Revisión de la persona**: revisión, pruebas manuales, configuración de la cuenta y commit.

Toda cifra es NO VERIFICADO hasta que se mida; si no se midió, se deja en blanco o se escribe «no medido». **No se rellena con estimaciones.**

| Lote | Inicio | Fin | (a) Generar | (b) Esperas | (c) Revisión de la persona | Estimado (a)/(b)/(c) | Notas (qué desvió el tiempo) |
|---|---|---|---|---|---|---|---|
| A. Base y seguridad | 2026-11-11 19:59:55 | ≈ 20:15 | ≈ 5 min (19:59:55 a ≈ 20:05, medido con las horas de las corridas de pruebas) | ≈ 9,5 min: instalación de paquetes ≈ 22 s, pruebas unitarias 6 s, build < 1 s y e2e completo 8,9 min (20:03:59 a 20:12:54, en paralelo con la escritura de documentos) | (la completa la persona) | 0,5–1 / 0,25–0,5 / 1,5–2,5 h | Muy por debajo de lo estimado en (a) y (b); la estimación de código y esperas del plan fue alta para este lote (lote pequeño, sin modelo real). No incluye mi tiempo de lectura de contexto antes de empezar. Las tareas de la persona (cuenta, crédito, límites, clave) no se midieron. |
| B. Extracción y verificador | 2026-11-11 20:41:47 | ≈ 20:58 | ≈ 6 min (20:41:47 a ≈ 20:47:30, incluido el spike, las 6 pruebas nuevas y el código) | ≈ 10 min: e2e completo 8,9 min (20:47:56 a 20:56:51) más unas 6 corridas de pruebas unitarias de 3 a 10 s cada una y un build de < 1 s; sin instalación de paquetes | (la completa la persona) | 1–1,5 / 0,5–1 / 1,5–2,5 h | De nuevo por debajo de lo estimado en (a); el e2e de la 001 domina las esperas. Un solo defecto encontrado por las pruebas (un archivo demasiado grande hacía fallar toda la carga); corregido. No incluye mi lectura de contexto previa. |
| C. Agente de Diagnóstico | | | | | | 1,5–2,5 / 0,5–1,5 / 3–4,5 h | Incluye corrida real: anotar también tokens, costo y tiempo de la corrida (SC-A6). |
| D. Frontend y persistencia | | | | | | 2–3 / 1–2 / 3–4,5 h | |
| E. Estrategia | | | | | | 1–1,5 / 0,5–1 / 1,5–2,5 h | |
| F. Cierre | | | | | | 1–1,5 / 1–1,5 / 2–3 h | |
| G. Crítico (diferido) | | | | | | 1–1,5 / 0,5–1 / 1–2 h | |

## Medición de la corrida real del lote C (SC-A6)

| Dato | Valor |
|---|---|
| Modelo (diagnóstico) | |
| Documentos usados (formatos y cantidad) | |
| Iteraciones | |
| Tokens (entrada / salida / total) | |
| Tiempo total de la corrida | |
| Costo estimado con la tarifa de la página oficial el día de la corrida | |
| Hallazgos / citas verificadas / citas fallidas | |
