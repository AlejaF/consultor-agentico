import { describe, expect, it } from 'vitest';
import { PROJECTS, emptyProjectState } from '../../src/data/projects';
import { deliveriesFor } from '../../src/domain/deliveries';
import { createInitialState } from '../../src/state/initial';
import type { PersistedState } from '../../src/state/types';

function blank(): PersistedState {
  const s = createInitialState();
  s.projects = Object.fromEntries(PROJECTS.map((p) => [p.id, emptyProjectState()]));
  return s;
}

describe('deliveriesFor', () => {
  it('sin diagnósticos emitidos no hay entregas', () => {
    expect(deliveriesFor(blank())).toEqual([]);
  });
  it('la entrega dx/<proyecto> existe solo con el diagnóstico emitido', () => {
    const s = blank();
    s.projects['P-A'].diagnosis = { status: 'generated', decisions: {} };
    expect(deliveriesFor(s)).toEqual([]);
    s.projects['P-A'].diagnosis = { status: 'issued', issuedAt: '2026-11-01T10:00:00Z', decisions: {} };
    expect(deliveriesFor(s)).toEqual([{ id: 'dx/P-A', tipo: 'dx', projectId: 'P-A', graded: false }]);
  });
  it('la estrategia enviada crea la entrega st; generada no', () => {
    const s = blank();
    s.projects['P-B'].diagnosis = { status: 'issued', issuedAt: '2026-11-01T10:00:00Z', decisions: {} };
    s.projects['P-B'].strategy = { status: 'generated' };
    expect(deliveriesFor(s).map((d) => d.id)).toEqual(['dx/P-B']);
    s.projects['P-B'].strategy = { status: 'sent', sentAt: '2026-11-01T11:00:00Z' };
    expect(deliveriesFor(s).map((d) => d.id)).toEqual(['dx/P-B', 'st/P-B']);
  });
  it('no se duplica aunque se llame varias veces y marca las calificadas', () => {
    const s = blank();
    s.projects['P-C'].diagnosis = { status: 'issued', issuedAt: '2026-11-01T10:00:00Z', decisions: {} };
    expect(deliveriesFor(s)).toEqual(deliveriesFor(s));
    s.gradings['dx/P-C'] = { levels: {}, comment: 'x', average: 4, gradedAt: '2026-11-01T12:00:00Z' };
    expect(deliveriesFor(s)).toEqual([{ id: 'dx/P-C', tipo: 'dx', projectId: 'P-C', graded: true }]);
  });
});
