# Contrato: estado persistido v3

Clave: `consultor-agentico-demo:state` (la misma de la 001). `schemaVersion: 3`.

## Cambios respecto de v2

```ts
interface ProjectState {            // v2 + lo siguiente
  mode: 'simulated' | 'real';       // por defecto 'simulated'
  serverFiles: { id: string; name: string; type: string; size: number }[];
  real?: {
    findings: RealFinding[];
    missingInfo: MissingInfo[];
    objections: Objection[];
    diagnosisRun?: TraceSummary;
    maturity?: RealMaturityLevel[];    // nuevo 2026-11-14 (AG-031): siempre seis entradas; el índice NO se guarda
    strategy?: { risks: RealStrategyItem[]; route: RealStrategyItem[] };
    strategyRun?: TraceSummary;
    criticRun?: TraceSummary;
  };
}
```
Tipos: ver [data-model.md](../data-model.md).

`RealMaturityLevel = { dimension, level: 1|2|3|4|5|null, insufficient: boolean, justification: string, derivesFrom: string[] }`.

**Sin subir la versión (decidido)**: `maturity` es opcional dentro de v3 (la v3 aún no se publicó). Un v3 sin él carga igual; un proyecto real así queda con las seis dimensiones «Sin evidencia suficiente» hasta volver a ejecutar. No hay decisiones por nivel: el respaldo vigente se deriva de las `decisions` de los hallazgos.

## Qué NO se guarda (AG-025)

- El **índice global de madurez** (se recalcula con `maturityIndex`, AG-031).
- El texto completo de los archivos.
- La clave, los modelos configurados del servidor, ni respuestas crudas del proveedor.
- La traza completa con fragmentos largos (se guarda un resumen con argumentos recortados).

## Migración

| Versión guardada | Acción |
|---|---|
| 3 | Validar forma y cargar. |
| 2 | **Migrar sin pérdida**: cada proyecto recibe `mode: 'simulated'` y `serverFiles: []`; se sube `schemaVersion` a 3. |
| otra | Estado inicial con aviso `version` (comportamiento actual de la 001). |

Si la forma v3 es inválida: estado inicial con aviso `corrupt` (como hoy). Hallazgos reales con forma inválida se descartan individualmente con aviso.

## Catálogos y validación

La 001 valida `decisions` contra `findingIds` fijos. En modo real los ids son dinámicos (`R1`…): la validación usa, por proyecto, `mode === 'real' ? ids de real.findings : findingIds de la plantilla`.

## Reglas

- `mode` no cambia si `diagnosis.status !== 'none'` (AG-029); solo «Limpiar diagnóstico» lo permite.
- «Restablecer demo» (FR-006) borra también `real` y `serverFiles`. **No** vacía la memoria del servicio por sí solo; se ofrece además «Quitar archivos del servicio» (llama a `DELETE`), y el texto de la confirmación lo dice.
