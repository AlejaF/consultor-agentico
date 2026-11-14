# Lote D2 — comprobación por mutación (T152)

Fecha: 2026-11-14. Método: para cada mutación se guardó una copia del archivo, se cambió **una sola cosa a propósito**, se corrieron las seis pruebas nuevas de D2 (`tools-maturity`, `diagnosis-maturity`, `maturityIndex`, `maturityState`, `sc-a8`, `maturityMixNote`), se restauró el original y se comprobó con comparación byte a byte que quedó **idéntico**. Resultado esperado: al menos una prueba falla con cada mutación.

| Mutación | Archivo | Qué se cambió | Pruebas que fallaron | Primera que falló | Original restaurado idéntico |
|---|---|---|---|---|---|
| M1 | `server/src/agent/maturity.ts` | verificador acepta hallazgos NO verificados | 2 | POST /api/diagnosis/run · madurez un modelo que cita un hallazgo NO verificado deja la dimensión «sin evidencia» y el rechazo queda en la traza | sí |
| M1b | `server/src/agent/maturity.ts` | verificador acepta hallazgos de otro pilar | 1 | registrar_nivel_madurez · verificador de respaldo rechaza un hallazgo verificado de otro pilar (una dimensión sin hallazgos verificados propios no tiene nivel) | sí |
| M2 | `src/domain/maturity.ts` | el promedio cuenta como 0 los niveles sin evidencia o sin respaldo | 12 | maturityIndex es el promedio de los niveles con respaldo vigente; los demás no entran | sí |
| M3 | `src/domain/maturity.ts` | cuenta como respaldo hallazgos rechazados o pendientes | 8 | respaldo vigente (misma lógica que FR-025) cuenta solo hallazgos aceptados o editados y verificados | sí |
| M4 | `src/domain/maturity.ts` | vuelve a excluir el modo real | 3 | projectMaturity y promedios un proyecto real emitido devuelve el índice calculado; no emitido, null | sí |
| M5 | `server/src/agent/diagnosis.ts` | el servidor devuelve un índice del modelo | 1 | POST /api/diagnosis/run · madurez la respuesta NO incluye ningún índice global, aunque el modelo lo intente | sí |
| M6 | `src/domain/maturity.ts` | cambia el valor del índice simulado | 1 | projectMaturity y promedios EL ÍNDICE SIMULADO NO CAMBIA: valores sembrados, plantilla y promedio 2,5 (FR-058 solo cambia en modo real) | sí |
| M7a | `src/domain/maturity.ts` | la nota de mezcla aparece siempre | 4 | averageMixesModes falso con los datos de ejemplo de la 001 (solo simulados) | sí |
| M7b | `src/domain/maturity.ts` | la nota de mezcla no aparece nunca | 1 | averageMixesModes verdadero con al menos un simulado emitido y un real emitido con índice | sí |
| M8 | `src/providers/real.ts` | el navegador confía en el servidor y acepta niveles con respaldo no verificado | 1 | SC-A8 el navegador no confía solo en el servicio: un nivel que cita un hallazgo NO verificado o inexistente llega como «sin evidencia» | sí |

**Resultado: las 10 mutaciones hicieron fallar al menos una prueba, y los 10 archivos quedaron restaurados idénticos.** M1 es la que pedía la persona: un nivel que cita un hallazgo no verificado hace fallar una prueba.

## Límites de esta comprobación

- Solo se corrieron las pruebas unitarias y de servicio (rápidas). **Las pruebas e2e no se usaron para mutar** (la persona pidió correr la suite e2e completa una sola vez, al final); la nota de mezcla del tablero se comprobó con su prueba unitaria (M7a y M7b), no con el e2e.
- Una mutación mide si las pruebas notan un cambio concreto; no demuestra que no existan otros defectos.
- Con la primera versión del script, el resultado se leía mal (todas mostraban «1 fallo» por un error de lectura del informe JSON); se detectó al revisar la salida, se corrigió el script y se repitió todo. Las cifras de la tabla son las de la segunda corrida.
