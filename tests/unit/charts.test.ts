// Lote H3 (AG-035): funciones puras de los gráficos. Datos de ejemplo + un caso borde cada una.
import { describe, expect, it } from 'vitest';
import { evidenceCoverage, groupByHorizon, maturityByProject, provenanceMatrix, reviewSegments, riskLevelSegments, stageSegments, traceSummary } from '../../src/domain/charts';
import { reviewStats } from '../../src/domain/visual';
import type { Decision } from '../../src/state/types';

const cite = (file: string) => ({ file, location: { kind: 'line' as const, n: 1 }, quote: 'x', verified: true });
const F = (id: string, dimension: 'datos' | 'cultura' | 'gobernanza', files: string[], verified = true) => ({ id, dimension, verified, realCitations: files.map(cite) });
const D = (state: Decision['state']): Decision => ({ state } as Decision);

describe('evidenceCoverage', () => {
  const findings = [F('R1', 'datos', ['a.txt', 'b.pdf']), F('R2', 'datos', ['a.txt']), F('R3', 'gobernanza', ['b.pdf']), F('R4', 'cultura', ['a.txt'], false)];
  it('cuenta solo hallazgos vigentes (aceptados o editados y verificados) por pilar y documento', () => {
    const c = evidenceCoverage(findings, { R1: D('accepted'), R2: D('edited'), R3: D('rejected'), R4: D('accepted') });
    expect(c.docs).toEqual(['a.txt', 'b.pdf']);
    const datos = c.rows.find((r) => r.dimension === 'datos')!;
    expect(datos.cells).toEqual([2, 1]);
    expect(datos.total).toBe(2);
    expect(c.rows.find((r) => r.dimension === 'gobernanza')!.cells).toEqual([0, 0]); // rechazado: no cuenta
    expect(c.rows.find((r) => r.dimension === 'cultura')!.cells).toEqual([0, 0]); // NO VERIFICADO: no cuenta
    expect(c.colTotals).toEqual([2, 1]);
    expect(c.total).toBe(2);
  });
  it('un hallazgo que cita dos veces el mismo documento cuenta una vez', () => {
    const c = evidenceCoverage([F('R1', 'datos', ['a.txt', 'a.txt'])], { R1: D('accepted') });
    expect(c.rows.find((r) => r.dimension === 'datos')!.cells).toEqual([1]);
  });
  it('borde: sin hallazgos', () => {
    const c = evidenceCoverage([], {});
    expect(c.docs).toEqual([]);
    expect(c.total).toBe(0);
    expect(c.rows).toHaveLength(6);
  });
  it('borde: un solo documento y pilar sin evidencia', () => {
    const c = evidenceCoverage([F('R1', 'datos', ['solo.txt'])], { R1: D('accepted') });
    expect(c.docs).toEqual(['solo.txt']);
    expect(c.rows.find((r) => r.dimension === 'cultura')!.cells).toEqual([0]);
    expect(c.rows.find((r) => r.dimension === 'cultura')!.empty).toBe(true);
  });
});

describe('reviewSegments', () => {
  it('cuatro partes que suman el total y NO VERIFICADO aparte', () => {
    const s = reviewStats([{ id: 'a', verified: true }, { id: 'b', verified: false }, { id: 'c', verified: true }, { id: 'd', verified: true }], { a: D('accepted'), b: D('edited'), c: D('rejected') });
    const r = reviewSegments(s);
    expect(r.parts.map((p) => [p.key, p.n])).toEqual([['accepted', 1], ['edited', 1], ['rejected', 1], ['pending', 1]]);
    expect(r.parts.reduce((a, p) => a + p.n, 0)).toBe(4);
    expect(r.unverified).toBe(1);
  });
  it('borde: sin hallazgos no hay porcentajes inventados', () => {
    const r = reviewSegments(reviewStats([], {}));
    expect(r.total).toBe(0);
    expect(r.parts.every((p) => p.percent === 0)).toBe(true);
  });
});

describe('provenanceMatrix', () => {
  const findings = [F('R1', 'datos', []), F('R2', 'datos', []), F('R3', 'cultura', []), F('R4', 'cultura', [])];
  const decisions = { R1: D('accepted'), R2: D('accepted'), R3: D('edited'), R4: D('rejected') };
  it('marca puntos según «Deriva de» y los aceptados que ninguna acción usa', () => {
    const m = provenanceMatrix(
      [{ id: 'ER1', label: 'Riesgo uno', kind: 'riesgo', derivedFrom: ['R1'] }, { id: 'EF1', label: 'Fase uno', kind: 'fase', derivedFrom: ['R1', 'R3'] }],
      findings,
      decisions,
    );
    expect(m.cols.map((c) => c.id)).toEqual(['R1', 'R2', 'R3']); // el rechazado no es columna
    expect(m.rows[0]!.marks).toEqual([true, false, false]);
    expect(m.rows[1]!.marks).toEqual([true, false, true]);
    expect(m.unused).toEqual(['R2']);
  });
  it('borde: sin elementos todos los aceptados quedan sin uso', () => {
    const m = provenanceMatrix([], findings, decisions);
    expect(m.unused).toEqual(['R1', 'R2', 'R3']);
  });
});

describe('riskLevelSegments', () => {
  it('hasta 3 partes y los riesgos sin nivel aparte', () => {
    const r = riskLevelSegments([{ level: 'alto' }, { level: 'alto' }, { level: 'bajo' }, {}]);
    expect(r.parts.map((p) => [p.key, p.n])).toEqual([['alto', 2], ['bajo', 1]]);
    expect(r.noLevel).toBe(1);
    expect(r.total).toBe(4);
  });
  it('borde: sin riesgos', () => {
    expect(riskLevelSegments([]).parts).toEqual([]);
  });
});

describe('stageSegments', () => {
  it('cuenta proyectos por etapa en orden fijo', () => {
    const s = stageSegments(['Evidencia', 'Estrategia', 'Evidencia']);
    expect(s.parts.map((p) => [p.key, p.n])).toEqual([['Evidencia', 2], ['Estrategia', 1]]);
    expect(s.total).toBe(3);
  });
  it('borde: sin proyectos', () => expect(stageSegments([]).total).toBe(0));
});

describe('maturityByProject', () => {
  it('ordena de mayor a menor, rotula y deja sin barra a los sin nivel', () => {
    const r = maturityByProject([
      { id: 'P-B', name: 'B', mode: 'simulated', index: 2.4 },
      { id: 'N-1', name: 'N', mode: 'real', index: 3.5 },
      { id: 'P-D', name: 'D', mode: 'simulated', index: null },
    ]);
    expect(r.bars.map((b) => b.id)).toEqual(['N-1', 'P-B']);
    expect(r.bars[1]!.illustrative).toBe(true);
    expect(r.bars[0]!.illustrative).toBe(false);
    expect(r.withoutLevel.map((x) => x.id)).toEqual(['P-D']);
  });
  it('borde: ninguno con nivel', () => {
    const r = maturityByProject([{ id: 'x', name: 'x', mode: 'real', index: null }]);
    expect(r.bars).toEqual([]);
  });
});

describe('traceSummary', () => {
  const run = { iterations: 4, tokens: { input: 10, output: 5, total: 15 }, verificationFailures: 1, toolCounts: { a: 1, b: 3 }, partial: false };
  it('ordena herramientas, calcula iteraciones contra el tope', () => {
    const t = traceSummary(run, 10);
    expect(t.tools).toEqual([{ name: 'b', n: 3 }, { name: 'a', n: 1 }]);
    expect(t.iterationsPercent).toBe(40);
    expect(t.failures).toBe(1);
    expect(t.tokens).toBe(15);
  });
  it('borde: sin tope conocido no inventa porcentaje; sin herramientas', () => {
    const t = traceSummary({ ...run, toolCounts: undefined }, null);
    expect(t.iterationsPercent).toBeNull();
    expect(t.tools).toEqual([]);
  });
});

describe('groupByHorizon', () => {
  it('agrupa por horizonte en orden de aparición; sin horizonte va a «Sin horizonte»', () => {
    const g = groupByHorizon([{ id: 'a', horizon: '30 días' }, { id: 'b', horizon: '90 días' }, { id: 'c', horizon: '30 días' }, { id: 'd' }]);
    expect(g.map((c) => [c.horizon, c.items.map((i) => i.id)])).toEqual([['30 días', ['a', 'c']], ['90 días', ['b']], ['Sin horizonte', ['d']]]);
  });
  it('borde: vacío', () => expect(groupByHorizon([])).toEqual([]));
});
