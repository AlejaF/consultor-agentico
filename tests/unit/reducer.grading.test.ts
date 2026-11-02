import { describe, expect, it } from 'vitest';
import { RUBRIC_CRITERIA } from '../../src/data/rubric';
import { deliveriesFor } from '../../src/domain/deliveries';
import { createInitialState } from '../../src/state/initial';
import { reducer } from '../../src/state/reducer';

const AT = '2026-11-01T10:00:00.000Z';
const levels = Object.fromEntries(RUBRIC_CRITERIA.map((c) => [c.id, 4 as const]));

describe('generateStrategy / sendStrategy', () => {
  it('generateStrategy solo con el diagnóstico emitido y es idempotente', () => {
    const s0 = createInitialState();
    expect(reducer(s0, { type: 'generateStrategy', projectId: 'P-A', at: AT })).toBe(s0); // sin emitir
    const s1 = reducer(s0, { type: 'generateStrategy', projectId: 'P-B', at: AT });
    expect(s1.projects['P-B'].strategy).toEqual({ status: 'generated', generatedAt: AT });
    expect(reducer(s1, { type: 'generateStrategy', projectId: 'P-B', at: '2027-01-01T00:00:00.000Z' })).toBe(s1);
  });
  it('sendStrategy solo con la estrategia generada y es idempotente', () => {
    const s0 = createInitialState();
    expect(reducer(s0, { type: 'sendStrategy', projectId: 'P-B', at: AT })).toBe(s0); // sin generar
    const s1 = reducer(s0, { type: 'generateStrategy', projectId: 'P-B', at: AT });
    const s2 = reducer(s1, { type: 'sendStrategy', projectId: 'P-B', at: AT });
    expect(s2.projects['P-B'].strategy.status).toBe('sent');
    expect(reducer(s2, { type: 'sendStrategy', projectId: 'P-B', at: AT })).toBe(s2);
  });
  it('la entrega st/<proyecto> existe solo con la estrategia enviada', () => {
    const s0 = createInitialState();
    const ids = (s: typeof s0) => deliveriesFor(s).map((d) => d.id);
    expect(ids(s0)).not.toContain('st/P-B');
    const s1 = reducer(s0, { type: 'generateStrategy', projectId: 'P-B', at: AT });
    expect(ids(s1)).not.toContain('st/P-B');
    expect(ids(reducer(s1, { type: 'sendStrategy', projectId: 'P-B', at: AT }))).toContain('st/P-B');
  });
});

describe('saveGrading', () => {
  it('guarda con el promedio exacto y la entrega pasa a calificada', () => {
    const s0 = createInitialState();
    expect(s0.gradings['dx/P-B']).toBeUndefined();
    const s1 = reducer(s0, { type: 'saveGrading', deliveryId: 'dx/P-B', levels, comment: 'Buen trabajo', at: AT });
    expect(s1.gradings['dx/P-B']).toEqual({ levels, comment: 'Buen trabajo', average: 4, gradedAt: AT });
    expect(deliveriesFor(s1).find((d) => d.id === 'dx/P-B')!.graded).toBe(true);
  });
  it('es idempotente: una entrega calificada es de solo lectura', () => {
    const s1 = reducer(createInitialState(), { type: 'saveGrading', deliveryId: 'dx/P-B', levels, comment: 'a', at: AT });
    const other = Object.fromEntries(RUBRIC_CRITERIA.map((c) => [c.id, 1 as const]));
    expect(reducer(s1, { type: 'saveGrading', deliveryId: 'dx/P-B', levels: other, comment: 'b', at: AT })).toBe(s1);
  });
  it('guarda sin comentario (opcional): queda vacío', () => {
    const s0 = createInitialState();
    for (const comment of ['', '   ']) {
      const s1 = reducer(s0, { type: 'saveGrading', deliveryId: 'dx/P-B', levels, comment, at: AT });
      expect(s1.gradings['dx/P-B']).toEqual({ levels, comment: '', average: 4, gradedAt: AT });
    }
  });
  it('no guarda incompleta, ni una entrega que no existe', () => {
    const s0 = createInitialState();
    expect(reducer(s0, { type: 'saveGrading', deliveryId: 'dx/P-B', levels: {}, comment: 'x', at: AT })).toBe(s0);
    expect(reducer(s0, { type: 'saveGrading', deliveryId: 'dx/P-A', levels, comment: 'x', at: AT })).toBe(s0); // sin emitir
    expect(reducer(s0, { type: 'saveGrading', deliveryId: 'st/P-B', levels, comment: 'x', at: AT })).toBe(s0); // sin enviar
    expect(reducer(s0, { type: 'saveGrading', deliveryId: 'xx/P-B', levels, comment: 'x', at: AT })).toBe(s0);
  });
  it('guardar una calificación no modifica el diagnóstico ni la estrategia (SC-013)', () => {
    const s0 = createInitialState();
    const s1 = reducer(s0, { type: 'saveGrading', deliveryId: 'dx/P-B', levels, comment: 'x', at: AT });
    expect(s1.projects).toBe(s0.projects);
    expect(s1.projects['P-B'].diagnosis.status).toBe('issued');
  });
  it('no existe ninguna acción para devolver el entregable', () => {
    const s0 = createInitialState();
    expect(reducer(s0, { type: 'returnDelivery' } as never)).toBe(s0 as never);
  });
});

describe('estado inicial sembrado (FR-033)', () => {
  it('P-C con estrategia enviada; dx/P-C, st/P-C y un equipo adicional calificados; los otros dos, por revisar', () => {
    const s = createInitialState();
    expect(s.projects['P-C'].strategy.status).toBe('sent');
    const d = deliveriesFor(s);
    const graded = d.filter((x) => x.graded).map((x) => x.id).sort();
    expect(graded).toContain('dx/P-C');
    expect(graded).toContain('st/P-C');
    const extraGraded = graded.filter((id) => /\/E-/.test(id));
    expect(extraGraded).toHaveLength(1);
    const extraPending = d.filter((x) => /E-/.test(x.projectId) && !x.graded);
    expect(extraPending).toHaveLength(2);
  });
});
