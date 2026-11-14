# Lote D2 — pruebas vistas fallar antes de implementar (T146)

Fecha: 2026-11-14. Comando: `npx vitest run` sobre los seis archivos nuevos de D2, **antes de escribir código** de D2.

Resultado: **44 pruebas fallan, 8 pasan**, en 6 archivos.

## Por qué fallan (razón esperada: el comportamiento todavía no existe)

| Archivo | Falla porque… |
|---|---|
| `tests/server/tools-maturity.test.ts` | `registrar_nivel_madurez` no existe («La herramienta … no existe»), la sesión no tiene `maturity()` |
| `tests/server/diagnosis-maturity.test.ts` | la respuesta de `/api/diagnosis/run` no trae `maturity` |
| `tests/unit/maturityIndex.test.ts` | `backedFindings`, `evaluateMaturity`, `maturityIndex`, `basedOnText` y `MATURITY_INDEX_LABEL` no existen; `projectMaturity` aún excluye el modo real |
| `tests/unit/maturityState.test.ts` | `real.maturity` aún no se valida ni se conserva |
| `tests/unit/sc-a8.test.ts` | el cliente falso rechaza llamar a una herramienta no declarada (502) y `toRealState` no produce `maturity` |
| `tests/unit/maturityMixNote.test.ts` | `averageMixesModes` y `MIX_NOTE` no existen |

## Las 8 que pasan antes de implementar (y por qué es esperado)

- Cuatro pruebas de rechazo de `tools-maturity` (justificación inválida, dimensión fuera de lista, argumento `indice`, otro pilar, varios ids): pasan «por vacío» porque la herramienta no existe y toda llamada devuelve error. **No prueban nada todavía**; su valor lo comprueban las mutaciones M1 y M1b de T152 (deben fallar al quitar el verificador).
- `maturityIndex.test.ts`: «EL ÍNDICE SIMULADO NO CAMBIA» y «proyecto real emitido sin niveles da null» pasan porque describen comportamiento que ya existe (guardia de regresión del índice simulado).
- `maturityState.test.ts`: `reviewProgress` y `canIssue` no dependen de los niveles: ya es verdad (guardia: `src/domain/review.ts` no se toca).

## Desviación honesta

Las pruebas e2e (`tests/e2e/ia-real-madurez.spec.ts`, T145, y su parte de la nota de mezcla) **se escribieron antes del código pero NO se vieron fallar**: la instrucción de la persona fue correr la suite e2e completa **una sola vez, al final**, así que no se ejecutó ninguna prueba e2e en esta fase. Se verán por primera vez en esa corrida única.
