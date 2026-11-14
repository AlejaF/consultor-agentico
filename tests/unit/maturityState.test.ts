// Lote D2 · T143 (AG-025, AG-031 puntos 6 y 12): persistencia de real.maturity y reviewProgress/canIssue intactos.
import { describe, expect, it } from 'vitest';
import { canIssue, reviewProgress } from '../../src/domain/review';
import { createInitialState, CATALOGS } from '../../src/state/initial';
import { createPersistence, STORAGE_KEY } from '../../src/state/persistence';
import { SCHEMA_VERSION, type Decision, type PersistedState, type RealMaturityLevel } from '../../src/state/types';
import { evaluateMaturity } from '../../src/domain/maturity';

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
};
const LEVELS: RealMaturityLevel[] = [
  { dimension: 'datos', level: 3, insufficient: false, justification: 'Justificación corta.', derivesFrom: ['R1'] },
  ...(['estrategia', 'infraestructura', 'gobernanza', 'talento', 'cultura'] as const).map((dimension) => ({ dimension, level: null, insufficient: true, justification: '', derivesFrom: [] })),
];
function realState(maturity?: RealMaturityLevel[]): PersistedState {
  const s = createInitialState();
  s.projects['P-A'] = {
    answers: {}, localFiles: [], strategy: { status: 'none' }, mode: 'real',
    diagnosis: { status: 'generated', generatedAt: '2026-11-14T10:00:00Z', decisions: { R1: { state: 'accepted' } } },
    real: {
      findings: [{ id: 'R1', dimension: 'datos', title: 't', text: 'x', verified: true, citations: [{ file: 'a.txt', location: { kind: 'line', n: 1 }, quote: 'frase literal', verified: true }], origin: 'agent' }],
      missingInfo: [], objections: [], ...(maturity ? { maturity } : {}),
    },
  };
  return s;
}
const open = (storage: ReturnType<typeof mem>) => createPersistence({ storage, catalogs: CATALOGS, initialState: createInitialState });
const roundTrip = (s: PersistedState) => {
  const storage = mem();
  const p = open(storage);
  p.save(s);
  p.flush();
  return { loaded: p.load(), raw: storage.m.get(STORAGE_KEY) ?? '' };
};

describe('estado v3 con real.maturity', () => {
  it('ida y vuelta de maturity, sin subir schemaVersion', () => {
    const { loaded, raw } = roundTrip(realState(LEVELS));
    expect(SCHEMA_VERSION).toBe(3);
    expect(JSON.parse(raw).schemaVersion).toBe(3);
    expect(loaded.state.projects['P-A']!.real!.maturity).toEqual(LEVELS);
    expect(loaded.notice).toBeNull();
  });
  it('un v3 SIN maturity carga sin aviso y las seis dimensiones salen «sin evidencia»', () => {
    const { loaded } = roundTrip(realState(undefined));
    expect(loaded.notice).toBeNull();
    const ps = loaded.state.projects['P-A']!;
    expect(ps.real!.maturity).toBeUndefined();
    expect(evaluateMaturity(ps.real!.maturity, ps.real!.findings, ps.diagnosis.decisions).levels.map((l) => l.status)).toEqual(Array(6).fill('insufficient'));
  });
  it('el JSON guardado NO contiene el índice', () => {
    const { raw } = roundTrip(realState(LEVELS));
    const real = JSON.parse(raw).projects['P-A'].real as Record<string, unknown>;
    expect(JSON.stringify(real)).not.toMatch(/maturityIndex|"index"|"indice"|"average"|"promedio"/i); // solo la parte real: «average» es de las calificaciones
    expect(Object.keys(real).sort()).toEqual(['findings', 'maturity', 'missingInfo', 'objections']);
  });
  it('un nivel con forma inválida se descarta con aviso sin romper la carga', () => {
    const s = realState(LEVELS);
    const raw = JSON.parse(JSON.stringify({ ...s })) as { projects: Record<string, { real: { maturity: unknown[] } }> };
    raw.projects['P-A']!.real.maturity.push({ dimension: 'inventada', level: 9 }, { dimension: 'datos', level: 7, insufficient: false, justification: 'x', derivesFrom: [] });
    const storage = mem();
    storage.setItem(STORAGE_KEY, JSON.stringify(raw));
    const loaded = open(storage).load();
    expect(loaded.state.projects['P-A']!.real!.maturity).toEqual(LEVELS);
    expect(loaded.notice).toBe('dropped');
  });
});

describe('reviewProgress y canIssue no dependen de los niveles (AG-031 punto 6)', () => {
  const ids = ['R1', 'R2', 'R3'];
  const decisions: Record<string, Decision> = { R1: { state: 'accepted' }, R2: { state: 'rejected' } };
  it('cuentan solo hallazgos: el mismo resultado con y sin niveles', () => {
    for (const maturity of [undefined, LEVELS]) {
      const s = realState(maturity);
      s.projects['P-A']!.diagnosis.decisions = decisions;
      expect(reviewProgress(ids, s.projects['P-A']!.diagnosis.decisions)).toEqual({ reviewed: 2, total: 3 });
      expect(canIssue(ids, s.projects['P-A']!.diagnosis.decisions)).toBe(false);
    }
    expect(canIssue(ids, { ...decisions, R3: { state: 'rejected' } })).toBe(true);
  });
});
