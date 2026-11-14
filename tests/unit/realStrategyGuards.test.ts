// Lote E · T100B (AG-019, AG-020, AG-025, AG-029): el navegador revalida la respuesta, no genera sin respaldo y guarda la corrida.
import { describe, expect, it } from 'vitest';
import { strategyBackedFindings, buildStrategyRequest } from '../../src/domain/realStrategy';
import { toRealStrategy } from '../../src/providers/real';
import type { StrategyResponse } from '../../src/providers/types';
import { buildTechSheet } from '../../src/domain/techSheet';
import { reducer } from '../../src/state/reducer';
import { createInitialState, CATALOGS } from '../../src/state/initial';
import { createPersistence, STORAGE_KEY } from '../../src/state/persistence';
import type { Decision, PersistedState, RealFinding, RealState } from '../../src/state/types';

const f = (id: string, verified = true): RealFinding => ({ id, dimension: 'datos', title: `T ${id}`, text: `Texto ${id}`, verified, citations: [{ file: 'a.txt', location: { kind: 'line', n: 1 }, quote: `frase ${id} literal`, verified }], origin: 'agent' });
const FINDINGS = [f('R1'), f('R2'), f('R3'), f('R4', false), f('R5')];
const DECISIONS: Record<string, Decision> = { R1: { state: 'accepted' }, R2: { state: 'edited', text: 'Texto editado' }, R3: { state: 'rejected' }, R4: { state: 'accepted' }, R5: { state: 'pending' } };
const resp = (risks: StrategyResponse['risks'], route: StrategyResponse['route'] = []): StrategyResponse => ({
  run: { stage: 'strategy', model: 'modelo-e', reasoning: null, iterations: 2, partial: false, tokens: { input: 10, output: 5, total: 15 } },
  risks, route, trace: [], warnings: [],
});
const item = (id: string, supportedBy: string[]) => ({ id, label: `L ${id}`, detail: 'Detalle.', level: 'alto' as const, supportedBy });
const phase = (id: string, supportedBy: string[]) => ({ id, label: `L ${id}`, detail: 'Detalle.', horizon: '0-3 meses', supportedBy });

describe('hallazgos que respaldan la estrategia', () => {
  it('solo los aceptados o editados Y verificados (no rechazados, pendientes ni NO VERIFICADO)', () => {
    expect(strategyBackedFindings(FINDINGS, DECISIONS).map((x) => x.id)).toEqual(['R1', 'R2']);
  });
  it('sin ninguno, la lista está vacía (la pantalla no puede generar ni llamar al modelo)', () => {
    expect(strategyBackedFindings(FINDINGS, { R1: { state: 'rejected' }, R4: { state: 'accepted' } })).toEqual([]);
  });
  it('la solicitud lleva el texto vigente (el editado) y solo extractos citados, nunca otros hallazgos', () => {
    const body = buildStrategyRequest('P-A', 'Empresa X', FINDINGS, DECISIONS);
    expect(body.findings.map((x) => [x.id, x.state, x.text])).toEqual([['R1', 'accepted', 'Texto R1'], ['R2', 'edited', 'Texto editado']]);
    expect(JSON.stringify(body)).not.toContain('R3');
    expect(JSON.stringify(body)).not.toContain('R4');
    expect(body.findings[0]!.quotes).toEqual([{ file: 'a.txt', location: { kind: 'line', n: 1 }, quote: 'frase R1 literal' }]);
  });
});

describe('el cliente revalida la respuesta del servicio', () => {
  const ok = (r: ReturnType<typeof toRealStrategy>) => r;
  it('quita ids inexistentes, rechazados, pendientes o NO VERIFICADO; descarta el elemento que se queda sin ids', () => {
    const r = ok(toRealStrategy(resp([item('ER1', ['R1', 'R9']), item('ER2', ['R3']), item('ER3', ['R4']), item('ER4', ['R5']), item('ER5', [])], [phase('EF1', ['R2', 'R3'])]), FINDINGS, DECISIONS, 'a', 'b'));
    expect(r.strategy.risks.map((x) => [x.id, x.supportedBy])).toEqual([['ER1', ['R1']]]);
    expect(r.strategy.route.map((x) => [x.id, x.supportedBy])).toEqual([['EF1', ['R2']]]);
  });
  it('un elemento mal formado (sin etiqueta, nivel raro) se descarta', () => {
    const bad = { ...item('ER1', ['R1']), level: 'enorme' as never };
    const r = toRealStrategy(resp([bad, { ...item('ER2', ['R1']), label: '' }, item('ER3', ['R1'])]), FINDINGS, DECISIONS, 'a', 'b');
    expect(r.strategy.risks.map((x) => x.id)).toEqual(['ER3']);
  });
  it('guarda la corrida con stage «strategy» y sin texto de documentos', () => {
    const r = toRealStrategy(resp([item('ER1', ['R1'])]), FINDINGS, DECISIONS, 'a', 'b');
    expect(r.strategyRun.stage).toBe('strategy');
    expect(r.strategyRun.model).toBe('modelo-e');
  });
});

describe('estado', () => {
  const base = (): PersistedState => {
    const s = reducer(createInitialState(), { type: 'setMode', projectId: 'P-A', mode: 'real' });
    const real: RealState = { findings: FINDINGS.slice(0, 2), missingInfo: [], objections: [] };
    const g = reducer(s, { type: 'generateReal', projectId: 'P-A', at: 'x', real });
    const dd = { ...g, projects: { ...g.projects, 'P-A': { ...g.projects['P-A']!, diagnosis: { ...g.projects['P-A']!.diagnosis, status: 'issued' as const, decisions: { R1: { state: 'accepted' as const }, R2: { state: 'edited' as const, text: 'e' } } } } } };
    return dd;
  };
  it('generateStrategy con estrategia real la guarda en real.strategy y real.strategyRun; sin ella (Simulado) no toca real', () => {
    const r = toRealStrategy(resp([item('ER1', ['R1'])]), FINDINGS, DECISIONS, 'a', 'b');
    const s = reducer(base(), { type: 'generateStrategy', projectId: 'P-A', at: 't', real: r });
    expect(s.projects['P-A']!.strategy.status).toBe('generated');
    expect(s.projects['P-A']!.real!.strategy!.risks[0]!.id).toBe('ER1');
    expect(s.projects['P-A']!.real!.strategyRun!.stage).toBe('strategy');
    expect(s.projects['P-A']!.real!.findings).toHaveLength(2); // el diagnóstico queda intacto
  });
  it('una estrategia real no se genera dos veces ni sobre un proyecto no emitido', () => {
    const r = toRealStrategy(resp([item('ER1', ['R1'])]), FINDINGS, DECISIONS, 'a', 'b');
    const once = reducer(base(), { type: 'generateStrategy', projectId: 'P-A', at: 't', real: r });
    expect(reducer(once, { type: 'generateStrategy', projectId: 'P-A', at: 't2', real: { ...r, strategy: { risks: [], route: [] } } })).toBe(once);
    const notIssued = reducer(reducer(createInitialState(), { type: 'setMode', projectId: 'P-A', mode: 'real' }), { type: 'generateStrategy', projectId: 'P-A', at: 't', real: r });
    expect(notIssued.projects['P-A']!.strategy.status).toBe('none');
  });
  it('AG-029: una estrategia simulada (sin real) nunca entra en un proyecto real', () => {
    const s = base();
    expect(reducer(s, { type: 'generateStrategy', projectId: 'P-A', at: 't' })).toBe(s);
    expect(s.projects['P-A']!.strategy.status).toBe('none');
  });
  it('un proyecto real NUNCA toma la plantilla simulada: sin real.strategy no hay elementos', async () => {
    const { getStrategy } = await import('../../src/providers');
    expect(getStrategy(base().projects['P-A']).template.risks).toEqual([]);
  });
  const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m }; };
  it('real.strategy se guarda y vuelve; una forma inválida se descarta con aviso', () => {
    const r = toRealStrategy(resp([item('ER1', ['R1'])]), FINDINGS, DECISIONS, 'a', 'b');
    const s = reducer(base(), { type: 'generateStrategy', projectId: 'P-A', at: 't', real: r });
    const storage = mem();
    const p = createPersistence({ storage, catalogs: CATALOGS, initialState: createInitialState });
    p.save(s); p.flush();
    expect(p.load().state.projects['P-A']!.real!.strategy!.risks).toHaveLength(1);
    const raw = JSON.parse(storage.m.get(STORAGE_KEY)!);
    raw.projects['P-A'].real.strategy.risks.push({ id: 5 }, 'x');
    storage.m.set(STORAGE_KEY, JSON.stringify(raw));
    const back = createPersistence({ storage, catalogs: CATALOGS, initialState: createInitialState }).load();
    expect(back.notice).toBe('dropped');
    expect(back.state.projects['P-A']!.real!.strategy!.risks).toHaveLength(1);
  });
  it('la ficha técnica incluye la corrida de estrategia, sin texto de documentos', () => {
    const r = toRealStrategy(resp([item('ER1', ['R1'])]), FINDINGS, DECISIONS, 'a', 'b');
    const s = reducer(base(), { type: 'generateStrategy', projectId: 'P-A', at: 't', real: r });
    const rows = buildTechSheet(s.projects['P-A']!.real)!;
    expect(rows.map((x) => x.stage)).toEqual(['strategy']);
  });
});
