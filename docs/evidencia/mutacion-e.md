# Lote E — comprobación por mutación de las reglas de verificación (T103A)

Fecha: 2026-11-14. Cada mutación rompió **una regla a propósito** sobre el archivo real; se corrieron las pruebas del lote (Vitest: 5 archivos de estrategia + `traceRoleGate`, o Playwright a 1280 px con la prueba correspondiente) y el original se restauró. La última columna confirma con `diff` que quedó **idéntico**. Todas hicieron fallar al menos una prueba.

| Mutación | Archivo | Resultado de las pruebas | Restaurado idéntico |
|---|---|---|---|
| M1 el verificador acepta ids que no existen en la entrada | `server/src/agent/strategy.ts` |       Tests  4 failed | 35 passed (39) | sí |
| M2 se acepta un derivaDe vacío | `server/src/agent/strategy.ts` |       Tests  2 failed | 37 passed (39) | sí |
| M3 el cliente deja de revalidar los ids de la respuesta | `src/providers/real.ts` |       Tests  1 failed | 38 passed (39) | sí |
| M4 respaldan hallazgos rechazados, pendientes o NO VERIFICADO | `src/domain/realStrategy.ts` |       Tests  3 failed | 36 passed (39) | sí |
| M5 una estrategia simulada entra en un proyecto real (AG-029) | `src/state/reducer.ts` |       Tests  1 failed | 38 passed (39) | sí |
| M6 el servicio marca como reintentable el error de saldo | `server/src/routes/strategy.ts` |       Tests  4 failed | 35 passed (39) | sí |
| M7 el texto del hallazgo ya no se escapa (instrucciones ocultas) | `server/src/agent/strategy.ts` |       Tests  1 failed | 38 passed (39) | sí |
| M8 la pantalla ofrece generar sin hallazgos respaldados | `src/components/RealStrategyGenerate.tsx` |   1 failed  | sí |
| M9 el modo real vuelve a mostrar sector y mercado | `src/components/StrategyView.tsx` |   1 failed  | sí |
| M10 la estrategia real se rotula como Simulada | `src/components/StrategyView.tsx` |   1 failed  | sí |
| M11 el error del proveedor se oculta (cae en silencio) | `src/components/RealStrategyGenerate.tsx` |   1 failed  | sí |
| M12 la traza de la estrategia se muestra sin rol (a la Empresa) | `src/components/TraceView.tsx` |       Tests  2 failed | 41 passed (43) | sí |
| M13 el desplegable de la traza se dibuja sin comprobar el rol | `src/components/TraceView.tsx` |       Tests  2 failed | 41 passed (43) | sí |

**Mutación que reveló un hueco (M12)**: la primera vez, quitar la comprobación de rol de `TraceView`/`RunNotices` NO hizo fallar ninguna prueba, porque las pantallas de la Empresa no dibujan la traza y la prueba solo vigilaba la función `canSeeTrace`. Se añadió `tests/unit/traceRoleGate.test.ts` (renderiza los componentes con cada rol) y entonces M12 y M13 se detectan.

Lectura: «Tests N failed» son las pruebas que detectaron el cambio; «1 failed» sin más es la prueba de pantalla que lo detectó.
