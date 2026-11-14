# Modelo de datos: Agente real con IA

**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

Dos lugares guardan datos, con reglas distintas:

| Lugar | Qué guarda | Duración |
|---|---|---|
| **Navegador** (estado persistido v3) | Modo, hallazgos generados, extractos citados, traza resumida, información faltante, objeciones, metadatos de archivos (id, nombre, tipo, tamaño) | Entre recargas (como la 001) |
| **Servicio local** (memoria del proceso) | Texto completo por archivo, dividido en fragmentos con ubicación | Mientras el servicio esté en ejecución; **nunca en disco** (AG-025, AG-026) |

## Entidades

### Modo del proyecto (AG-001, AG-029)
`mode: 'simulated' | 'real'` por proyecto. Se **fija** al generar el diagnóstico. Transiciones:
- sin diagnóstico → (generar) → modo fijado.
- Con diagnóstico generado o emitido, cambiar de modo exige «Limpiar diagnóstico» (vuelve a `none`, descarta hallazgos y decisiones, con confirmación) o crear otro proyecto. La interfaz explica por qué.

### Archivo en el servicio (`ServerFile`)
`{ id, projectId, name, type, size, status: 'extracted' | 'failed', reason?, chars, chunkCount }`. `reason` es el motivo claro (AG-007): `pdf_sin_texto`, `cifrado`, `danado`, `formato_no_permitido`, `demasiado_grande`, `nombre_largo`, `tope_filas_alcanzado` (parcial). El servicio guarda además, solo en memoria, los `Chunk`s.

### Fragmento (`Chunk`, solo en servicio)
`{ fileId, location: Location, text }`.

`Location` (unión etiquetada, mostrable como texto):
- `{ kind: 'page', page }` → «pág. 3»
- `{ kind: 'paragraph', n }` → «párrafo 12»
- `{ kind: 'sheet', sheet, row }` → «hoja “Ventas”, fila 7»
- `{ kind: 'line', n }` → «línea 45»
- `{ kind: 'time', start: 'mm:ss' }` → «minuto 03:10»

### Cita (`Citation`)
`{ file: nombre, location: Location, quote: string, verified: boolean }`. Se guarda el **fragmento citado** (`quote`), no el texto completo del archivo. Rótulo en pantalla: «Extracto de tu archivo» (AG-024).

### Hallazgo real (`RealFinding`)
Compatible con `Finding` de la 001, más campos:
`{ id: 'R1'…, dimension, title, text, citations: Citation[], verified: boolean, unverifiedReason?, origin: 'agent' }`.
- `verified` = al menos una cita verificada **y** ninguna cita presentada como verificada sin serlo (AG-016).
- Un hallazgo sin cita verificada: `verified: false` con `unverifiedReason` (AG-017).
- El `id` es estable dentro del proyecto (`R1`, `R2`…) y es la clave de las decisiones (`Decision`) de la 001.

### Información faltante (`MissingInfo`)
`{ dimension, description }[]`. Texto de salida rotulado como IA (AG-021). No crea flujos.

### Nivel de madurez (`RealMaturityLevel`, AG-031)
`{ dimension, level: 1..5 | null, insufficient, justification (≤ 300), derivesFrom: id[] }`; siempre seis, una por dimensión.
- `level` numérico solo si `derivesFrom` tiene al menos un hallazgo `verified: true` (SC-A8); si no, `level: null` e `insufficient: true` («Sin evidencia suficiente · NO VERIFICADO»).
- **Respaldo vigente** (misma lógica que FR-025): el nivel cuenta solo si algún hallazgo de `derivesFrom` está aceptado o editado y verificado según las `decisions` actuales; `N` = cuántos. Con N = 0 se muestra «Sin respaldo vigente» y sale del cálculo. **No hay decisión por nivel.**
- **Índice global** (no es una entidad guardada): `maturityIndex` = promedio de `level` de los niveles con respaldo vigente; `null` («—») si no hay ninguno. Lo calcula el código, nunca el modelo; se recalcula en cada vista. Rótulo: «Calculado por código a partir de niveles propuestos por IA».

### Objeción (`Objection`, P3)
`{ findingId, text, kind: 'debil' | 'contradice' | 'sin_respaldo' }`. No cambia el estado de la decisión (AG-022).

### Traza (`Trace`) y su resumen persistido
Completa (la devuelve el servicio y se muestra): lista ordenada de `TraceStep`.
`TraceStep` =
- `{ type: 'tool', name, args (resumidos), resultSummary, ok }` (p. ej. `buscar_en_evidencia`, consulta, N resultados)
- `{ type: 'verification', findingTempId, ok, reason?, resolution?: 'corregida' | 'descartada' | 'no_verificado' }`
- `{ type: 'tool_error', name, error }` (argumentos mal formados devueltos al agente)
- `{ type: 'warning', code: 'iteration_limit' | 'input_truncated' | 'injection_suspected' | … , message }`
- `{ type: 'model_error', category, message }`

Persistida (resumida, AG-025): `{ stage, model, reasoning?, iterations, tokens: { input, output, total }, errors: { category, message }[], partial: boolean, startedAt, finishedAt, toolCounts: Record<string, number>, verificationFailures: number }`. **No** se persiste la lista completa de pasos si contiene fragmentos largos; se persiste una versión con argumentos recortados a 200 caracteres.

### Corrida (`Run`)
`{ stage: 'diagnosis' | 'strategy' | 'critic', model, tokens, partial, errors, trace }`.

### Estrategia real (`RealStrategy`)
`{ risks: RealStrategyItem[], route: RealStrategyItem[] }`, con `RealStrategyItem = { id, kind: 'risk' | 'phase', text, level?: 'alto' | 'medio' | 'bajo', horizon?: string, supportedBy: string[] }`. Compatible con `StrategyItem` de la 001 (`supportedBy`), de modo que **`deriveStrategy` se reutiliza sin cambios** (sector y mercado quedan vacíos y no se muestran en modo real).

**Regla doble de respaldo (SC-A4, SC-012)**: (1) al registrar, el verificador de `registrar_elemento` rechaza ids que no existan o no sean aceptados/editados y verificados; (2) al mostrar, `deriveStrategy` vuelve a filtrar por las decisiones **actuales** de la persona. Si la persona cambia una decisión después, el elemento desaparece sin volver a llamar al modelo.

## Estado persistido (resumen; detalle en [contracts/persisted-state-v3.md](./contracts/persisted-state-v3.md))

```text
ProjectState (v3) = v2 +
  mode: 'simulated' | 'real'                     // por defecto 'simulated'
  real?: {
    findings: RealFinding[]
    missingInfo: MissingInfo[]
    maturity?: RealMaturityLevel[]               // AG-031: seis entradas; el índice no se guarda
    objections: Objection[]
    diagnosisRun?: TraceSummary
    strategy?: RealStrategy
    strategyRun?: TraceSummary
    criticRun?: TraceSummary
  }
  serverFiles: { id, name, type, size }[]         // metadatos de lo subido en modo real
```

`DiagnosisState.decisions` se mantiene: en modo real las claves son los ids `R…`.

## Reglas de validación

- Un hallazgo real mostrado como verificado **debe** tener al menos una cita con `verified: true` (SC-A1; la prueba automática recorre los resultados y comprueba cada cita contra el texto fuente).
- Una `Location` solo puede referirse a un archivo del proyecto.
- Al cargar el estado v3 se valida la forma; hallazgos con forma inválida se descartan con aviso, no rompen la carga.
- El modo no cambia con diagnóstico presente (AG-029).

## Transiciones de estado relevantes

1. `none` →(Generar, modo real)→ `generated` con `real.findings` y traza.
2. `generated` → revisión (Aceptar/Editar/Rechazar) → `issued` (sin cambios respecto de la 001).
3. `issued` → evidencia nueva: **no** altera el diagnóstico emitido (solo lectura, FR-021).
4. `generated|issued` →(Limpiar diagnóstico)→ `none` (permite cambiar de modo).
