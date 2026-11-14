import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/state/initial';
import { reducer } from '../../src/state/reducer';
import type { PersistedState, RealState } from '../../src/state/types';

const real = (ids: string[]): RealState => ({
  findings: ids.map((id) => ({ id, dimension: 'datos' as const, title: `t${id}`, text: 'x', verified: true, origin: 'agent' as const, citations: [{ file: 'a.txt', location: { kind: 'line' as const, n: 1 }, quote: 'q', verified: true }] })),
  missingInfo: [{ dimension: 'talento', description: 'falta' }],
  objections: [],
});
const at = '2026-11-13T10:00:00.000Z';
const start = (): PersistedState => createInitialState();
const realGenerated = (s = start()) => reducer(reducer(s, { type: 'setMode', projectId: 'P-A', mode: 'real' }), { type: 'generateReal', projectId: 'P-A', at, real: real(['R1', 'R2']) });

describe('modo por proyecto (AG-029)', () => {
  it('el modo se elige antes de generar y queda fijado al generar', () => {
    const s = reducer(start(), { type: 'setMode', projectId: 'P-A', mode: 'real' });
    expect(s.projects['P-A']!.mode).toBe('real');
    const g = realGenerated();
    expect(g.projects['P-A']!.diagnosis.status).toBe('generated');
    expect(Object.keys(g.projects['P-A']!.diagnosis.decisions)).toEqual(['R1', 'R2']);
    expect(reducer(g, { type: 'setMode', projectId: 'P-A', mode: 'simulated' })).toBe(g); // no cambia con diagnóstico
  });
  it('en modo real, «generate» (la plantilla de ejemplo) no hace nada: no se mezclan', () => {
    const s = reducer(start(), { type: 'setMode', projectId: 'P-A', mode: 'real' });
    expect(reducer(s, { type: 'generate', projectId: 'P-A', at })).toBe(s);
  });
  it('generateReal exige modo real y diagnóstico sin generar (idempotente)', () => {
    const s = start();
    expect(reducer(s, { type: 'generateReal', projectId: 'P-A', at, real: real(['R1']) })).toBe(s); // todavía en Simulado
    const g = realGenerated();
    expect(reducer(g, { type: 'generateReal', projectId: 'P-A', at, real: real(['R9']) })).toBe(g);
  });
  it('decidir, editar y emitir funcionan con los ids reales; un id de la plantilla se ignora', () => {
    let s = realGenerated();
    s = reducer(s, { type: 'decide', projectId: 'P-A', findingId: 'H1', decision: 'accepted' });
    expect(s.projects['P-A']!.diagnosis.decisions['H1']).toBeUndefined();
    s = reducer(s, { type: 'decide', projectId: 'P-A', findingId: 'R1', decision: 'accepted' });
    s = reducer(s, { type: 'edit', projectId: 'P-A', findingId: 'R2', text: 'Texto editado' });
    s = reducer(s, { type: 'issue', projectId: 'P-A', at });
    expect(s.projects['P-A']!.diagnosis.status).toBe('issued');
  });
  it('«Limpiar diagnóstico» vuelve a none, descarta hallazgos y decisiones y permite cambiar de modo', () => {
    const s = reducer(realGenerated(), { type: 'clearDiagnosis', projectId: 'P-A' });
    expect(s.projects['P-A']!.diagnosis).toEqual({ status: 'none', decisions: {} });
    expect(s.projects['P-A']!.real).toBeUndefined();
    expect(reducer(s, { type: 'setMode', projectId: 'P-A', mode: 'simulated' }).projects['P-A']!.mode).toBe('simulated');
  });
  it('un diagnóstico emitido no se limpia (es de solo lectura y puede tener entrega)', () => {
    let s = realGenerated();
    s = reducer(reducer(s, { type: 'decide', projectId: 'P-A', findingId: 'R1', decision: 'accepted' }), { type: 'decide', projectId: 'P-A', findingId: 'R2', decision: 'rejected' });
    s = reducer(s, { type: 'issue', projectId: 'P-A', at });
    expect(reducer(s, { type: 'clearDiagnosis', projectId: 'P-A' })).toBe(s);
  });
  it('«Restablecer demo» borra también real y serverFiles', () => {
    let s = reducer(realGenerated(), { type: 'addServerFiles', projectId: 'P-A', files: [{ id: 'f1', name: 'a.txt', type: 'text/plain', size: 3 }] });
    expect(s.projects['P-A']!.serverFiles).toHaveLength(1);
    s = reducer(s, { type: 'reset', state: createInitialState() });
    expect(s.projects['P-A']!.real).toBeUndefined();
    expect(s.projects['P-A']!.serverFiles).toBeUndefined();
    expect(s.projects['P-A']!.mode).toBeUndefined();
  });
  it('los archivos del servicio no se duplican por id', () => {
    const f = { id: 'f1', name: 'a.txt', type: 'text/plain', size: 3 };
    let s = reducer(start(), { type: 'addServerFiles', projectId: 'P-A', files: [f] });
    s = reducer(s, { type: 'addServerFiles', projectId: 'P-A', files: [f, { ...f, id: 'f2', name: 'b.txt' }] });
    expect(s.projects['P-A']!.serverFiles!.map((x) => x.id)).toEqual(['f1', 'f2']);
  });
});
