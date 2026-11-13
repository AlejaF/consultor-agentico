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
| C. Agente de Diagnóstico | no medido | no medido | ≈ 15–20 min de Claude, estimado por las horas de los mensajes, no medido | no medido (las dos corridas reales sumaron 57 s según el script; ver abajo) | (la completa la persona) | 1,5–2,5 / 0,5–1,5 / 3–4,5 h | Cifra estimada, **no medida**. Incluye las correcciones posteriores (error 400 y otros 4xx del proveedor, `--guardar-traza`, tarifa por modelo). Tokens, costo y tiempo de las corridas reales: tabla de abajo (SC-A6). |
| D. Frontend y persistencia | | | | | | 2–3 / 1–2 / 3–4,5 h | |
| E. Estrategia | | | | | | 1–1,5 / 0,5–1 / 1,5–2,5 h | |
| F. Cierre | | | | | | 1–1,5 / 1–1,5 / 2–3 h | |
| G. Crítico (diferido) | | | | | | 1–1,5 / 0,5–1 / 1–2 h | |

## Medición de la corrida real del lote C (SC-A6)

Dos corridas manuales con `node scripts/smoke-real.mjs` (T064), sobre los mismos 7 documentos ficticios de `tests/fixtures/` (6 formatos: txt ×2, vtt, srt, xlsx, docx, pdf; sin los hostiles). Resúmenes: [`humo-real-luna-low.md`](evidencia/humo-real-luna-low.md) y [`humo-real-sol-medium.md`](evidencia/humo-real-sol-medium.md) (copia de `humo-real.md`). El tiempo es el de la llamada a `/api/diagnosis/run` medido por el script (no incluye la subida de archivos).

| Dato | Luna / razonamiento `low` | Sol / razonamiento `medium` |
|---|---|---|
| Modelo (diagnóstico) | `gpt-6-luna` | `gpt-6.1-sol` |
| Fecha de la corrida (UTC) | 2026-11-13 16:17 | 2026-11-13 17:02 |
| Documentos usados (formatos y cantidad) | 7 (txt ×2, vtt, srt, xlsx, docx, pdf) | 7 (los mismos) |
| Iteraciones | 7 | 5 |
| Tokens (entrada / salida / total) | 24 073 / 1 152 / 25 225 | 16 723 / 1 994 / 18 717 |
| Tiempo total de la corrida | 21,7 s | 35,5 s |
| Costo estimado (tarifa del modelo según `research.md`; sin contar entrada en caché) | US$ 0,0030 (0,10 / 0,50 por 1M) | **US$ 0,0534** (2 / 10 por 1M). Corregido: el resumen original usó por error la tarifa de Luna (0,0027) |
| Hallazgos (verificados) | 3 (3) | 7 (7) |
| Citas / verificadas / fallidas | 3 / 3 / 0 | 10 / 10 / 0 |
| Verificaciones fallidas, avisos | 0, ninguno | 0, ninguno |
| Contraste con el panel de uso de la plataforma | no medido | no medido |

Notas: el costo es una **estimación** (NO VERIFICADO contra el panel de uso). En ambas corridas el verificador aceptó todas las citas a la primera. Sol propuso más del doble de hallazgos y más citas por hallazgo con ~28 % menos tokens de entrada, a unas 18 veces el costo de Luna; la calidad de fondo no se evaluó de forma sistemática.
