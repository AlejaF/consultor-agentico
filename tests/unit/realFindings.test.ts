import { describe, expect, it } from 'vitest';
import { DIAGNOSIS } from '../../src/data/diagnosis';
import { STRATEGY } from '../../src/data/strategy';
import { formatRealLocation } from '../../src/domain/realCitation';
import { reportContent } from '../../src/domain/report';
import { countUnverifiedAdopted } from '../../src/domain/review';
import { deriveStrategy } from '../../src/domain/strategy';
import { projectMaturity } from '../../src/domain/maturity';
import { getDiagnosis } from '../../src/providers';
import { clip, summarizeTrace, toRealState } from '../../src/providers/real';
import type { DiagnosisResponse } from '../../src/providers/types';
import { createInitialState } from '../../src/state/initial';
import { createPersistence, STORAGE_KEY } from '../../src/state/persistence';
import { reducer } from '../../src/state/reducer';
import type { ProjectState } from '../../src/state/types';

const LONG = 'palabra '.repeat(400); // 3200 caracteres: «texto completo» de un archivo
const response = (): DiagnosisResponse => ({
  run: { stage: 'diagnosis', model: 'modelo-x', reasoning: 'low', iterations: 3, partial: false, tokens: { input: 100, output: 20, total: 120 } },
  findings: [
    { id: 'R1', dimension: 'datos', title: 'Uno', text: 'texto uno', verified: true, citations: [{ file: 'a.txt', location: { kind: 'line', n: 4 }, quote: 'frase literal de prueba', verified: true }] },
    { id: 'R2', dimension: 'gobernanza', title: 'Dos', text: 'texto dos', verified: true, citations: [{ file: 'b.pdf', location: { kind: 'page', page: 2 }, quote: 'otra', verified: false }] },
    { id: 'R3', dimension: 'talento', title: 'Tres', text: 'texto tres', verified: false, unverifiedReason: 'ninguna cita pudo verificarse', citations: [] },
  ],
  missingInfo: [{ dimension: 'cultura', description: 'Faltan encuestas.' }],
  trace: [
    { type: 'tool', name: 'buscar_en_evidencia', args: { consulta: LONG }, resultSummary: '5 fragmentos', ok: true },
    { type: 'verification', findingTempId: 'datos|uno', ok: false, reason: 'no aparece', resolution: 'corregida' },
    { type: 'model_error', category: 'rate_limit', message: 'x' },
  ],
  warnings: [],
});

describe('conversión de la respuesta del servicio a hallazgos reales', () => {
  const real = toRealState(response(), '2026-11-13T10:00:00Z', '2026-11-13T10:00:30Z');
  it('verified exige al menos una cita verificada (se aplica otra vez en el navegador)', () => {
    expect(real.findings.map((f) => f.verified)).toEqual([true, false, false]);
    expect(real.findings[1]!.unverifiedReason).toBeTruthy(); // marcado verificado por el servicio, pero su única cita no lo está
    expect(real.findings[2]!.unverifiedReason).toBe('ninguna cita pudo verificarse');
    expect(real.findings.every((f) => f.origin === 'agent')).toBe(true);
  });
  it('es compatible con Finding: getDiagnosis lo entrega con realCitations y ids R1…', () => {
    const v = getDiagnosis({ mode: 'real', real });
    expect(v.ids).toEqual(['R1', 'R2', 'R3']);
    expect(v.findings[0]).toMatchObject({ id: 'R1', dimension: 'datos', verified: true });
  });
  it('la traza guardada recorta los argumentos a 200 caracteres y cuenta herramientas, fallos y errores', () => {
    const t = summarizeTrace(response(), 'a', 'b');
    const tool = t.steps[0] as { args: { consulta: string } };
    expect(tool.args.consulta.length).toBeLessThanOrEqual(201);
    expect(t.toolCounts).toEqual({ buscar_en_evidencia: 1 });
    expect(t.verificationFailures).toBe(1);
    expect(t.errors).toEqual([{ category: 'rate_limit', message: 'x' }]);
    expect(clip('a'.repeat(300))).toHaveLength(201);
  });
  it('formatea la ubicación según el tipo de archivo', () => {
    expect(formatRealLocation({ kind: 'page', page: 3 })).toBe('pág. 3');
    expect(formatRealLocation({ kind: 'paragraph', n: 12 })).toBe('párrafo 12');
    expect(formatRealLocation({ kind: 'sheet', sheet: 'Ventas', row: 7 })).toBe('hoja “Ventas”, fila 7');
    expect(formatRealLocation({ kind: 'line', n: 45 })).toBe('línea 45');
    expect(formatRealLocation({ kind: 'time', start: '03:10' })).toBe('minuto 03:10');
  });
});

describe('lo guardado en el navegador NO contiene el texto completo de los archivos (AG-025)', () => {
  it('el estado serializado recorta fragmentos y argumentos', () => {
    const r = toRealState(response(), 'a', 'b');
    r.findings[0]!.citations[0]!.quote = LONG;
    const data = new Map<string, string>();
    const p = createPersistence({ storage: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) }, initialState: createInitialState, catalogs: { projectIds: ['P-A'], findingIds: [], criterionIds: [] } });
    const s0 = createInitialState();
    const proj: ProjectState = { ...s0.projects['P-A']!, mode: 'real', real: r, serverFiles: [{ id: 'f1', name: 'a.txt', type: 'text/plain', size: 9, ...({ text: LONG } as object) } as never] };
    p.save({ ...s0, projects: { 'P-A': proj } });
    p.flush();
    const saved = data.get(STORAGE_KEY)!;
    expect(saved).not.toContain(LONG);
    expect(saved).not.toMatch(/(palabra ){260,}/); // ni la cita (acotada a 2000 caracteres) ni los argumentos de la traza (200)
    const back = JSON.parse(saved).projects['P-A'];
    expect(back.real.findings[0].citations[0].quote.length).toBe(2000);
    expect(back.serverFiles[0]).toEqual({ id: 'f1', name: 'a.txt', type: 'text/plain', size: 9 }); // sin campos extra
  });
});

describe('el flujo de la 001 funciona con hallazgos reales', () => {
  const real = toRealState(response(), 'a', 'b');
  const decisions = { R1: { state: 'accepted' as const }, R2: { state: 'accepted' as const }, R3: { state: 'rejected' as const } };
  const findings = getDiagnosis({ mode: 'real', real }).findings;
  it('countUnverifiedAdopted cuenta los NO VERIFICADO aceptados', () => {
    expect(countUnverifiedAdopted(findings, decisions)).toBe(1); // R2 quedó no verificado y está aceptado
  });
  it('reportContent incluye los aceptados, cuenta los excluidos y no inventa índice de madurez ni estrategia', () => {
    const c = reportContent({ status: 'issued', issuedAt: 'x', decisions }, { status: 'none' }, 'consultor', null, findings);
    expect(c.available && c.findings.map((f) => f.finding.id)).toEqual(['R1', 'R2']);
    expect(c.available && c.excluded).toBe(1);
    expect(c.available && c.unverifiedShown).toBe(1);
    expect(c.available && c.maturityIndex).toBeNull();
    expect(c.available && c.strategy.kind).toBe('unavailable');
  });
  it('deriveStrategy no deriva nada de hallazgos reales con la plantilla de ejemplo (no se mezclan)', () => {
    expect(deriveStrategy(STRATEGY, findings, decisions).empty).toBe(true);
  });
  it('la plantilla de ejemplo no cambia: reportContent sin findings usa DIAGNOSIS como antes', () => {
    const d = Object.fromEntries(DIAGNOSIS.findings.map((f) => [f.id, { state: 'accepted' as const }]));
    const c = reportContent({ status: 'issued', decisions: d }, { status: 'none' }, 'consultor');
    expect(c.available && c.findings).toHaveLength(DIAGNOSIS.findings.length);
    expect(c.available && c.maturityIndex).toBe(DIAGNOSIS.maturityIndex);
  });
  it('un proyecto en modo real emitido sin niveles con respaldo vigente queda fuera de los promedios de madurez (AG-031)', () => {
    let s = reducer(createInitialState(), { type: 'setMode', projectId: 'P-A', mode: 'real' });
    s = reducer(s, { type: 'generateReal', projectId: 'P-A', at: 'x', real });
    s = reducer(reducer(s, { type: 'decide', projectId: 'P-A', findingId: 'R1', decision: 'accepted' }), { type: 'decide', projectId: 'P-A', findingId: 'R2', decision: 'rejected' });
    s = reducer(reducer(s, { type: 'decide', projectId: 'P-A', findingId: 'R3', decision: 'rejected' }), { type: 'issue', projectId: 'P-A', at: 'x' });
    expect(s.projects['P-A']!.diagnosis.status).toBe('issued');
    expect(projectMaturity(s, 'P-A')).toBeNull();
    expect(projectMaturity(s, 'P-B')).not.toBeNull();
  });
});
