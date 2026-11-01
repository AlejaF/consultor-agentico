# Modelo de datos (Fase 1): DEMO navegable Consultor Agéntico

Todos los datos son **ficticios** (principio I). Los nombres son inventados y evidentemente falsos («Empresa Ficticia Alfa», «Equipo Demo 1», «Consultora Demo»). Los tipos se escriben en TypeScript solo como notación; el código real sale de aquí en `/speckit-tasks`.

## 1. Dos capas

| Capa | Dónde vive | ¿Cambia con el uso? | ¿Se persiste? |
|---|---|---|---|
| **Estática** | `src/data/*.ts` | No | No |
| **Persistida** | estado del navegador (`PersistedState`) | Sí | Sí, con `schemaVersion` |
| **Derivada** | funciones de `src/domain/` | Se recalcula | No |

## 2. Capa estática (entidades de referencia)

```ts
type Role = 'consultor' | 'lider' | 'contacto'
type Dimension = 'estrategia' | 'infraestructura' | 'datos' | 'gobernanza' | 'talento' | 'cultura'

interface Account { role: Role; displayName: string; subtitle: string }       // 3 cuentas, sin credenciales
interface Company { id: string; name: string; sector: string; size: string }  // nombres ficticios
interface Team { id: string; name: string; projectIds: string[] }             // 'Equipo Demo Alfa' = el del Consultor
interface Project { id: string; teamId: string; companyId: string;
  ownedByDemoConsultor: boolean; initial: ProjectState; lastActivityLabel: string;
  sampleSlots: Slot[] /* ranuras visibles en su lista de evidencia; P-D: [] */ }
type Slot = 1 | 2 | 3 | 4 | 5                                                   // ranura de evidencia, igual en todos los proyectos
interface EvidenceSlot { slot: Slot; kind: 'documento'|'transcripcion'|'entrevista';
  name: string /* admite {empresa} */; detail: string; excerpts: Excerpt[] }      // origen: 'ejemplo'
interface Excerpt { id: string; slot: Slot; locator: string; text: string }        // «min 14:20», «pág. 12»
interface Finding { id: string; dimension: Dimension; title: string; text: string;
  citations: Citation[]; verified: boolean; unverifiedReason?: string;
  plainText?: string /* se añade en L5b (no existe en L3): texto no técnico para el Contacto, FR-035 */ } // 8 por diagnóstico, 1 con verified=false
interface Citation { slot: Slot; excerptId: string }                           // ≥ 1 por hallazgo (FR-017); resuelve por ranura
interface DiagnosisTemplate { maturityIndex: number; findings: Finding[] }         // UNA, compartida por todos los proyectos
interface StrategyTemplate { risks: StrategyItem[]; route: StrategyItem[];
  sectorAnalysis: string; marketAnalysis: string }                             // sector/mercado: NO VERIFICADO
interface StrategyItem { id: string; label: string; detail: string; level?: 'alto'|'medio'|'bajo';
  horizon?: string; supportedBy: string[] /* FindingId */ }
interface RubricCriterion { id: string; name: string; description: string }    // 4, «de ejemplo»
interface Survey { questions: { id: string; text: string; required: boolean }[] }
interface CaptureQuestion { id: string; label: string; kind: 'select'|'text'; options?: string[] }
```

Cantidades iniciales (NO VERIFICADO que sean las definitivas; se fijan en las tareas): 4 proyectos del Consultor y 3 equipos más para el Líder; **5 ranuras de evidencia de ejemplo** (la ranura 5 con procesamiento pendiente en algunos proyectos); **8 hallazgos** con las seis dimensiones en la plantilla de diagnóstico; 4 riesgos y 4 fases de ruta en la plantilla de estrategia; 4 criterios de rúbrica; 5 preguntas de encuesta.

### 2.1 Plantillas únicas compartidas

- Existe **UNA** `DiagnosisTemplate` (8 hallazgos, 6 dimensiones) y **UNA** `StrategyTemplate`, usadas por **todos** los proyectos, tanto los del Consultor como los de los equipos adicionales del Líder. Lo único que cambia entre proyectos es el nombre ficticio de la empresa (`{empresa}`), el estado inicial (`ProjectState`) y qué ranuras de evidencia se muestran (`sampleSlots`).
- La evidencia de ejemplo se define **por ranura (1 a 5)**, no por proyecto: cada ranura tiene nombre, tipo, detalle y extractos. Las citas de los hallazgos apuntan a `{ slot, excerptId }`, por lo que **resuelven en cualquier proyecto**, incluido uno cuya lista visible no incluya esa ranura (por ejemplo **P-D**: sin evidencia propia hasta que se cargue un archivo; el diagnóstico cita evidencia de ejemplo). **Toda cita se rotula «Evidencia de ejemplo (ficticia)»**, también cuando el elemento citado no aparece en la lista de evidencia del proyecto (FR-017).
- Los identificadores de hallazgo, de ranura y de elemento de estrategia son **iguales en todos los proyectos**; las decisiones (`Decision`) sí son por proyecto.
- Los equipos adicionales del Líder reutilizan las mismas plantillas con otros nombres ficticios de empresa; sus estados iniciales (entregas por revisar y una calificada) se definen como `ProjectState` precargados.
- El campo `plainText` de cada hallazgo se crea en **L5b** (no en L3), con su prueba: todo hallazgo de la plantilla tiene un `plainText` no vacío.
- Una prueba unitaria comprueba que **toda cita de la plantilla resuelve a una ranura y un extracto existentes** y que cada hallazgo tiene al menos una cita.

Proyectos del Consultor (estado inicial):
- **P-A**: con evidencia completa, diagnóstico sin generar (recorrido principal).
- **P-B**: diagnóstico emitido, estrategia sin generar (probar estrategia). Sus decisiones sembradas incluyen **un hallazgo aceptado pero NO VERIFICADO, uno editado y uno rechazado** (el resto aceptados), que usa la prueba e2e de la estrategia.
- **P-C**: diagnóstico emitido y estrategia enviada, con **ambas entregas calificadas** (`dx/P-C` y `st/P-C`), para ver la calificación.
- **P-D**: **sin evidencia** (probar el bloqueo, FR-014).
Equipos para el Líder: tres equipos más con diagnóstico emitido; **uno tiene `dx` calificado y los otros dos quedan por revisar** (FR-033). El estado inicial incluye, por tanto, `gradings` para `dx/P-C`, `st/P-C` y `dx/<proyecto del equipo calificado>`.

## 3. Capa persistida (`PersistedState`, versión 1)

```ts
interface PersistedState {
  schemaVersion: 1
  session: { role: Role | null }
  projects: Record<string /* ProjectId */, ProjectState>
  gradings: Record<string /* 'dx/<projectId>' | 'st/<projectId>' */, Grading>
  surveys: Record<string /* ProjectId */, SurveyResponse>
  activity: ActivityItem[]            // máx. 50, más recientes primero
}
interface ProjectState {
  answers: Record<string /* questionId */, string>
  localFiles: LocalFileMeta[]         // SOLO metadatos
  diagnosis: DiagnosisState
  strategy: StrategyState
}
interface LocalFileMeta { id: string; name: string; type: string; size: number; addedAt: string /* ISO */ }
interface DiagnosisState {
  status: 'none' | 'generated' | 'issued'
  generatedAt?: string; issuedAt?: string
  decisions: Record<string /* FindingId */, Decision>
}
type Decision =
  | { state: 'pending' }
  | { state: 'accepted' }
  | { state: 'edited'; text: string }          // text no vacío
  | { state: 'rejected' }
interface StrategyState { status: 'none' | 'generated' | 'sent'; generatedAt?: string; sentAt?: string }
interface Grading { levels: Record<string /* criterionId */, 1|2|3|4|5>; comment: string;
  average: number /* media exacta */; gradedAt: string }
interface SurveyResponse { answers: Record<string, 1|2|3|4|5 | string>; submittedAt?: string }
interface ActivityItem { at: string; text: string; projectId?: string }
```

Lo que **no** se persiste: contenido de archivos, extractos, hallazgos, estrategia derivada, entregas, promedios, avances.

## 4. Capa derivada (funciones puras)

| Función | Entrada → salida | Requisitos |
|---|---|---|
| `validateFiles(files, existing)` | metadatos de archivos → `{ accepted[], rejected[{name, reason}] }` | FR-010 |
| `canGenerate(project)` | evidencia total ≥ 1 | FR-015 |
| `reviewProgress(findings, decisions)` | → `{ reviewed, total }` | FR-019 |
| `canIssue(findings, decisions)` | todos revisados y ≥ 1 `accepted`/`edited` | FR-021 |
| `isValidEdit(text)` | texto con contenido no vacío | FR-020 |
| `deriveStrategy(template, findings, decisions)` | → elementos incluidos con `derivedFrom` | FR-025, SC-012 |
| `average(levels)` / `formatScore(n)` | media exacta; formato `4,2` / `1,0` | FR-031, SC-013 |
| `deliveriesFor(state)` | entregas del Consultor y precargadas | FR-022, FR-027, FR-033 |
| `reportContent(project, state, scope)` | contenido del informe; `scope` = `consultor` (proyecto propio: diagnóstico y, si existe, estrategia generada), `dx` (solo el diagnóstico) o `st` (estrategia enviada con su diagnóstico); nunca una estrategia generada pero no enviada en un informe de entrega | FR-044 a 046 |
| `accessDecision(route, role)` | → `allow` / `redirect(to, notice)` | FR-003 |

## 5. Reglas de validación (de los requisitos)

- **Archivo** (FR-010): extensión en `pdf, docx, txt, vtt, srt` (sin distinguir mayúsculas); tamaño `> 0` y `≤ 25 MB` (26 214 400 bytes); nombre `≤ 150` caracteres; nombre repetido en el mismo proyecto → rechazado. Cada rechazo lleva un motivo en español; los válidos de una misma selección se aceptan.
- **Generar** (FR-015): al menos 1 elemento de evidencia (de ejemplo o archivo propio).
- **Decisión** (FR-019/020): `edited` exige texto con contenido; una edición vacía no se guarda.
- **Emitir** (FR-021): todos los hallazgos con decisión distinta de `pending`, y al menos un `accepted` o `edited`. Un hallazgo `verified: false` puede aceptarse y conserva «NO VERIFICADO».
- **Estrategia** (FR-023/024/025): la acción «Generar estrategia» solo está disponible si `diagnosis.status === 'issued'` y es idempotente (simulación de 1,5 s en la interfaz); cada elemento aparece solo si tiene ≥ 1 hallazgo de respaldo con decisión `accepted`/`edited` **y** `verified: true`; `derivedFrom` lista **solo** esos hallazgos: **un hallazgo aceptado pero NO VERIFICADO no cuenta como respaldo ni aparece en `derivedFrom`**; si ningún elemento tiene respaldo, la pantalla muestra un aviso. **`sendStrategy` solo con la estrategia generada** (`strategy.status === 'generated'`) y es idempotente (FR-027).
- **Calificación** (FR-030/031): los 4 criterios con nivel entero 1–5 y comentario no vacío; `average` = media aritmética exacta; se muestra con 1 decimal y coma (`4,3`; si es exacto `4,0`); se compara con «Meta del programa (ilustrativa): 4,2 de 5» sin efectos sobre el flujo.
- **Encuesta** (FR-036): todas las preguntas obligatorias respondidas.

## 6. Transiciones de estado

```text
Diagnóstico:  none ──generar──▶ generated ──aprobar y emitir──▶ issued (solo lectura)
                 (bloqueado sin evidencia)   (todos revisados, ≥1 aceptado/editado)

Estrategia:   none ──(solo con diagnóstico issued)──«Generar estrategia» (1,5 s «Simulada»)──▶ generated ──enviar──▶ sent
                                                              (idempotente: reenviar no duplica)

Entrega:      por_revisar ──guardar calificación──▶ calificada (solo lectura)
              (diagnóstico: se crea al emitir; estrategia: se crea al enviar)

Decisión:     pending ──▶ accepted | edited | rejected      (reversible mientras el diagnóstico no esté emitido)
```

- Regla transversal: **la calificación nunca modifica `diagnosis` ni `strategy`** (FR-031); una prueba lo comprueba comparando el estado antes y después.
- «Restablecer demo» (FR-006): vuelve al estado inicial completo y borra el almacenamiento.
- Evidencia agregada tras emitir: se guarda, el diagnóstico emitido no cambia y se muestra el aviso (caso límite del spec).

## 7. Identificadores de entrega

`DeliveryId` = `dx/<projectId>` (diagnóstico emitido) o `st/<projectId>` (estrategia enviada). Son la clave de `gradings` y se corresponden con la ruta `#/lider/entregas/:tipo/:projectId`, donde `:tipo` es `dx` o `st` (dos segmentos de ruta, sin caracteres especiales que codificar). Las entregas precargadas de otros equipos usan los mismos prefijos con sus propios proyectos. Una entrega **existe** solo si el diagnóstico está emitido (`dx`) o la estrategia enviada (`st`); en otro caso la ruta se trata como inexistente.
