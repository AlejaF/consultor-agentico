# Registro de tiempo real de la especificación 002 «Agente real con IA»

Sirve para **calibrar** las estimaciones del plan ([`specs/002-agente-real/plan.md`](../specs/002-agente-real/plan.md), «Lotes y calendario»). Es tiempo de **reloj real**, no horas de desarrollador humano. Lo anota el agente al cerrar cada lote; la columna de revisión la completa la persona responsable.

**Definiciones**
- **(a) Generar código**: del inicio del lote hasta tener el código y las pruebas escritos, sin contar esperas largas.
- **(b) Esperas inevitables**: instalación de paquetes, ejecución de pruebas (unitarias, Playwright, suite completa) y corridas reales del modelo.
- **(c) Revisión de la persona**: revisión, pruebas manuales, configuración de la cuenta y commit.

Toda cifra es NO VERIFICADO hasta que se mida; si no se midió, se deja en blanco o se escribe «no medido». **No se rellena con estimaciones.**

| Lote | Inicio | Fin | (a) Generar | (b) Esperas | (c) Revisión de la persona | Estimado (a)/(b)/(c) | Notas (qué desvió el tiempo) |
|---|---|---|---|---|---|---|---|
| A. Base y seguridad | | | | | | 0,5–1 / 0,25–0,5 / 1,5–2,5 h | |
| B. Extracción y verificador | | | | | | 1–1,5 / 0,5–1 / 1,5–2,5 h | |
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
