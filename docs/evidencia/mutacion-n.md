# Lote N — mutaciones (T188)

Cada mutación se aplicó, se corrieron las pruebas y el archivo se restauró (comparado con `diff`, idéntico).

| # | Mutación | Archivo | Resultado |
|---|---|---|---|
| M1 | Quitar la validación de nombre duplicado | `src/domain/createdProjects.ts` | **Detectada** (3 pruebas: validación, reductor y persistencia) |
| M2 | Quitar el escape del nombre en el mensaje al agente | `server/src/agent/empresa.ts` | **Detectada** (3 pruebas: etiqueta, Diagnóstico y Estrategia) |
| M3 | Permitir Simulado en un proyecto creado | `src/state/reducer.ts` | **Detectada** (1 prueba, AG-029) |
| M4 | No validar los proyectos creados al cargar | `src/state/persistence.ts` | **Detectada** (1 prueba) |
