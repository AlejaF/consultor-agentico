import { describe, expect, it } from 'vitest';
import { DIAGNOSIS } from '../../src/data/diagnosis';
import { reducer } from '../../src/state/reducer';
import { createInitialState } from '../../src/state/initial';

const IDS = DIAGNOSIS.findings.map((f) => f.id);
const UNVERIFIED = DIAGNOSIS.findings.find((f) => !f.verified)!.id;
const AT = '2026-11-01T20:00:00.000Z';

function generated() {
  return reducer(createInitialState(), { type: 'generate', projectId: 'P-A', at: AT });
}
function reviewedAll(except: string[] = []) {
  let s = generated();
  for (const id of IDS) if (!except.includes(id)) s = reducer(s, { type: 'decide', projectId: 'P-A', findingId: id, decision: 'accepted' });
  return s;
}

describe('generate', () => {
  it('none → generated con todas las decisiones pendientes', () => {
    const s = generated();
    expect(s.projects['P-A'].diagnosis.status).toBe('generated');
    expect(s.projects['P-A'].diagnosis.generatedAt).toBe(AT);
    expect(Object.keys(s.projects['P-A'].diagnosis.decisions).sort()).toEqual([...IDS].sort());
    expect(Object.values(s.projects['P-A'].diagnosis.decisions).every((d) => d.state === 'pending')).toBe(true);
  });
  it('es idempotente: no reinicia un diagnóstico ya generado o emitido', () => {
    const s = reducer(generated(), { type: 'decide', projectId: 'P-A', findingId: 'H1', decision: 'accepted' });
    expect(reducer(s, { type: 'generate', projectId: 'P-A', at: '2030-01-01T00:00:00Z' })).toBe(s);
    const issuedState = createInitialState();
    expect(reducer(issuedState, { type: 'generate', projectId: 'P-B', at: AT })).toBe(issuedState); // P-B ya emitido
  });
});

describe('decide', () => {
  it('es reversible mientras no esté emitido', () => {
    let s = generated();
    s = reducer(s, { type: 'decide', projectId: 'P-A', findingId: 'H1', decision: 'accepted' });
    s = reducer(s, { type: 'decide', projectId: 'P-A', findingId: 'H1', decision: 'rejected' });
    expect(s.projects['P-A'].diagnosis.decisions.H1).toEqual({ state: 'rejected' });
    s = reducer(s, { type: 'decide', projectId: 'P-A', findingId: 'H1', decision: 'pending' });
    expect(s.projects['P-A'].diagnosis.decisions.H1).toEqual({ state: 'pending' });
  });
  it('sin diagnóstico generado o con hallazgo inexistente no cambia nada', () => {
    const s0 = createInitialState();
    expect(reducer(s0, { type: 'decide', projectId: 'P-A', findingId: 'H1', decision: 'accepted' })).toBe(s0);
    const s1 = generated();
    expect(reducer(s1, { type: 'decide', projectId: 'P-A', findingId: 'H99', decision: 'accepted' })).toBe(s1);
  });
  it('un hallazgo NO VERIFICADO puede aceptarse', () => {
    const s = reducer(generated(), { type: 'decide', projectId: 'P-A', findingId: UNVERIFIED, decision: 'accepted' });
    expect(s.projects['P-A'].diagnosis.decisions[UNVERIFIED]).toEqual({ state: 'accepted' });
  });
});

describe('edit', () => {
  it('guarda el texto nuevo (sin espacios sobrantes) como editado', () => {
    const s = reducer(generated(), { type: 'edit', projectId: 'P-A', findingId: 'H2', text: '  Texto corregido  ' });
    expect(s.projects['P-A'].diagnosis.decisions.H2).toEqual({ state: 'edited', text: 'Texto corregido' });
  });
  it('una edición vacía no se guarda', () => {
    const s = generated();
    expect(reducer(s, { type: 'edit', projectId: 'P-A', findingId: 'H2', text: '   ' })).toBe(s);
  });
});

describe('issue', () => {
  it('emite con todo revisado y al menos un aceptado; registra la fecha', () => {
    const s = reducer(reviewedAll(), { type: 'issue', projectId: 'P-A', at: AT });
    expect(s.projects['P-A'].diagnosis.status).toBe('issued');
    expect(s.projects['P-A'].diagnosis.issuedAt).toBe(AT);
  });
  it('con pendientes no emite', () => {
    const s = reviewedAll(['H3']);
    expect(reducer(s, { type: 'issue', projectId: 'P-A', at: AT })).toBe(s);
  });
  it('con todo rechazado no emite', () => {
    let s = generated();
    for (const id of IDS) s = reducer(s, { type: 'decide', projectId: 'P-A', findingId: id, decision: 'rejected' });
    expect(reducer(s, { type: 'issue', projectId: 'P-A', at: AT })).toBe(s);
  });
  it('emitido es de solo lectura y no se emite dos veces', () => {
    const issued = reducer(reviewedAll(), { type: 'issue', projectId: 'P-A', at: AT });
    expect(reducer(issued, { type: 'decide', projectId: 'P-A', findingId: 'H1', decision: 'rejected' })).toBe(issued);
    expect(reducer(issued, { type: 'edit', projectId: 'P-A', findingId: 'H1', text: 'otro' })).toBe(issued);
    expect(reducer(issued, { type: 'issue', projectId: 'P-A', at: '2031-01-01T00:00:00Z' })).toBe(issued);
  });
  it('los rechazados quedan registrados como rechazados (excluidos)', () => {
    let s = reviewedAll();
    s = reducer(s, { type: 'decide', projectId: 'P-A', findingId: 'H4', decision: 'rejected' });
    s = reducer(s, { type: 'issue', projectId: 'P-A', at: AT });
    expect(s.projects['P-A'].diagnosis.decisions.H4).toEqual({ state: 'rejected' });
  });
});
