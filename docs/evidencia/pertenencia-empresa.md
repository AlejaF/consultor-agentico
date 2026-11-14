# Corrección: el nombre del proyecto es contexto, no filtro (2026-11-14)

Causa: ningún código filtra por nombre; el nombre solo entraba en el mensaje inicial («Analiza la evidencia de la empresa «X»…») y el prompt de sistema no decía nada sobre pertenencia. Causa en el modelo real: inferida, NO CONFIRMADA (sin API real).
Pruebas: `tests/server/empresa-contexto.test.ts`, `tests/e2e/ia-real-aviso-empresa.spec.ts` (vistas fallar antes del cambio).
Mutación 1: restaurar la redacción anterior → 2 pruebas fallan. Mutación 2: quitar el aviso → falla la prueba de pantalla. Ambos archivos restaurados idénticos.
