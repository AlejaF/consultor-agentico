import { describe, expect, it, vi } from 'vitest';
import { createPersistence, STORAGE_KEY } from '../../src/state/persistence';
import { SCHEMA_VERSION, type PersistedState, type ProjectState, type RealFinding } from '../../src/state/types';

const catalogs = { projectIds: ['P-A', 'P-B'], findingIds: ['H1', 'H2'], criterionIds: ['c1'] };
const proj = (extra: Partial<ProjectState> = {}): ProjectState => ({ answers: { q1: 'hola' }, localFiles: [], diagnosis: { status: 'none', decisions: {} }, strategy: { status: 'none' }, ...extra });
const initial = (): PersistedState => ({ schemaVersion: SCHEMA_VERSION, session: { role: null }, projects: { 'P-A': proj(), 'P-B': proj() }, gradings: {}, surveys: {}, activity: [] });
const store = (seed?: unknown) => {
  const data = new Map<string, string>();
  if (seed !== undefined) data.set(STORAGE_KEY, JSON.stringify(seed));
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
};
const load = (seed: unknown) => createPersistence({ storage: store(seed), initialState: initial, catalogs, onMemoryMode: vi.fn() }).load();
const rf = (id: string, over: Partial<RealFinding> = {}): RealFinding => ({ id, dimension: 'datos', title: `t${id}`, text: 'x', verified: true, origin: 'agent', citations: [{ file: 'a.txt', location: { kind: 'line', n: 1 }, quote: 'q', verified: true }], ...over });
const realProject = (findings: unknown[], decisions: Record<string, unknown>): unknown => ({ ...proj(), mode: 'real', serverFiles: [], real: { findings, missingInfo: [], objections: [] }, diagnosis: { status: 'generated', decisions } });

describe('migración v2 → v3', () => {
  it('migra SIN pérdida: cada proyecto recibe mode «simulated» y serverFiles []; nada más cambia', () => {
    const v2 = { ...initial(), schemaVersion: 2, projects: { 'P-A': proj({ diagnosis: { status: 'generated', decisions: { H1: { state: 'accepted' }, H2: { state: 'pending' } } } }), 'P-B': proj() } };
    const r = load(v2);
    expect(r.notice).toBeNull();
    expect(r.state.schemaVersion).toBe(3);
    expect(r.state.projects['P-A']).toEqual({ ...v2.projects['P-A'], mode: 'simulated', serverFiles: [] });
    expect(r.state.projects['P-B']!.answers).toEqual({ q1: 'hola' });
  });
  it('una v2 con forma inválida → estado inicial con aviso corrupt', () => {
    expect(load({ ...initial(), schemaVersion: 2, session: 5 }).notice).toBe('corrupt');
  });
  it('otra versión → estado inicial con aviso version; forma v3 inválida → corrupt', () => {
    expect(load({ ...initial(), schemaVersion: 1 }).notice).toBe('version');
    expect(load({ ...initial(), schemaVersion: 99 }).notice).toBe('version');
    expect(load({ ...initial(), session: 5 }).notice).toBe('corrupt');
  });
});

describe('estado v3 en modo real', () => {
  it('los ids de decisions son los de real.findings (dinámicos), no los fijos de la plantilla', () => {
    const ok = load({ ...initial(), projects: { 'P-A': realProject([rf('R1'), rf('R2')], { R1: { state: 'accepted' }, R2: { state: 'pending' } }), 'P-B': proj() } });
    expect(ok.notice).toBeNull();
    expect(ok.state.projects['P-A']!.real!.findings.map((f) => f.id)).toEqual(['R1', 'R2']);
    const bad = load({ ...initial(), projects: { 'P-A': realProject([rf('R1')], { H1: { state: 'accepted' } }), 'P-B': proj() } });
    expect(bad.notice).toBe('corrupt'); // H1 no es un id de este proyecto en modo real
  });
  it('un hallazgo real con forma inválida se descarta UNO A UNO, con aviso, y su decisión con él', () => {
    const broken = { id: 'R2', dimension: 'inventado', title: 1 };
    const r = load({ ...initial(), projects: { 'P-A': realProject([rf('R1'), broken], { R1: { state: 'accepted' }, R2: { state: 'pending' } }), 'P-B': proj() } });
    expect(r.notice).toBe('dropped');
    expect(r.state.projects['P-A']!.real!.findings.map((f) => f.id)).toEqual(['R1']);
    expect(Object.keys(r.state.projects['P-A']!.diagnosis.decisions)).toEqual(['R1']);
  });
  it('la información faltante inválida (o de más de 400 caracteres) también se descarta con aviso', () => {
    const p = realProject([rf('R1')], { R1: { state: 'pending' } }) as ProjectState;
    p.real!.missingInfo = [{ dimension: 'datos', description: 'ok' }, { dimension: 'x', description: 'mal' }, { dimension: 'talento', description: 'a'.repeat(401) }] as never;
    const r = load({ ...initial(), projects: { 'P-A': p, 'P-B': proj() } });
    expect(r.notice).toBe('dropped');
    expect(r.state.projects['P-A']!.real!.missingInfo).toEqual([{ dimension: 'datos', description: 'ok' }]);
  });
  it('en modo Simulado, un `real` sobrante no borra las decisiones de la plantilla', () => {
    const p = { ...proj({ diagnosis: { status: 'generated', decisions: { H1: { state: 'accepted' } } } }), mode: 'simulated', real: { findings: [rf('R1')], missingInfo: [], objections: [] } };
    expect(load({ ...initial(), projects: { 'P-A': p, 'P-B': proj() } }).state.projects['P-A']!.diagnosis.decisions).toEqual({ H1: { state: 'accepted' } });
  });
});
