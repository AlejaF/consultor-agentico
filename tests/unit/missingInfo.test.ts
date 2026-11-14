import { describe, expect, it } from 'vitest';
import { toRealState } from '../../src/providers/real';
import type { DiagnosisResponse } from '../../src/providers/types';
import { CATALOGS as catalogs, createInitialState } from '../../src/state/initial';
import { createPersistence, STORAGE_KEY } from '../../src/state/persistence';
import { reducer } from '../../src/state/reducer';

const resp = (missing: DiagnosisResponse['missingInfo']): DiagnosisResponse => ({
  run: { stage: 'diagnosis', model: 'm', reasoning: null, iterations: 1, partial: false, tokens: { input: 1, output: 1, total: 2 } },
  findings: [{ id: 'R1', dimension: 'datos', title: 't', text: 'x', verified: true, citations: [{ file: 'a.txt', location: { kind: 'line', n: 1 }, quote: 'q', verified: true }] }],
  missingInfo: missing,
  trace: [],
  warnings: [],
});
const storeWith = (seed?: string) => {
  const data = new Map<string, string>();
  if (seed) data.set(STORAGE_KEY, seed);
  return { data, s: { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) } };
};

describe('información faltante (AG-021)', () => {
  it('el estado guarda real.missingInfo, con el texto acotado a 400 caracteres', () => {
    const real = toRealState(resp([{ dimension: 'talento', description: 'a'.repeat(900) }, { dimension: 'cultura', description: 'Faltan encuestas.' }]), 'a', 'b');
    expect(real.missingInfo.map((m) => m.description.length)).toEqual([400, 17]);
    let s = reducer(createInitialState(), { type: 'setMode', projectId: 'P-A', mode: 'real' });
    s = reducer(s, { type: 'generateReal', projectId: 'P-A', at: 'x', real });
    expect(s.projects['P-A']!.real!.missingInfo).toHaveLength(2);
  });
  it('es solo texto: no crea decisiones ni cambia el avance de la revisión', () => {
    const real = toRealState(resp([{ dimension: 'talento', description: 'x' }]), 'a', 'b');
    let s = reducer(createInitialState(), { type: 'setMode', projectId: 'P-A', mode: 'real' });
    s = reducer(s, { type: 'generateReal', projectId: 'P-A', at: 'x', real });
    expect(Object.keys(s.projects['P-A']!.diagnosis.decisions)).toEqual(['R1']);
  });
  it('se conserva entre recargas (guardar y volver a cargar)', () => {
    let s = reducer(createInitialState(), { type: 'setMode', projectId: 'P-A', mode: 'real' });
    s = reducer(s, { type: 'generateReal', projectId: 'P-A', at: 'x', real: toRealState(resp([{ dimension: 'cultura', description: 'Faltan encuestas.' }]), 'a', 'b') });
    const { s: storage } = storeWith();
    const p = createPersistence({ storage, initialState: createInitialState, catalogs });
    p.save(s);
    p.flush();
    const back = createPersistence({ storage, initialState: createInitialState, catalogs }).load();
    expect(back.notice).toBeNull();
    expect(back.state.projects['P-A']!.real!.missingInfo).toEqual([{ dimension: 'cultura', description: 'Faltan encuestas.' }]);
  });
  it('una forma inválida se descarta con aviso, sin tirar el resto', () => {
    let s = reducer(createInitialState(), { type: 'setMode', projectId: 'P-A', mode: 'real' });
    s = reducer(s, { type: 'generateReal', projectId: 'P-A', at: 'x', real: toRealState(resp([{ dimension: 'cultura', description: 'ok' }]), 'a', 'b') });
    const raw = JSON.parse(JSON.stringify(s));
    raw.projects['P-A'].real.missingInfo.push({ dimension: 'no-existe', description: 'mal' }, 42);
    const { s: storage } = storeWith(JSON.stringify(raw));
    const r = createPersistence({ storage, initialState: createInitialState, catalogs }).load();
    expect(r.notice).toBe('dropped');
    expect(r.state.projects['P-A']!.real!.missingInfo).toEqual([{ dimension: 'cultura', description: 'ok' }]);
    expect(r.state.projects['P-A']!.real!.findings).toHaveLength(1);
  });
});
