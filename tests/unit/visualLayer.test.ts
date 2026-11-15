// Lote H (AG-033): capa visual. Valor → ancho y etiqueta; «Sin evidencia» nunca con número; tarjeta del nivel general; cifras de revisión.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ScaleBar } from '../../src/components/ScaleBar';
import { MaturityIndexCard } from '../../src/components/MaturityIndexCard';
import { ReviewStats } from '../../src/components/ReviewStats';
import { MaturityPanel } from '../../src/components/MaturityPanel';
import { evaluateMaturity, type LevelView } from '../../src/domain/maturity';
import { LOW_LABEL, averageBar, hasRealIssued, levelBar, pillarAverages, reviewStats, segmentFills } from '../../src/domain/visual';
import { createInitialState } from '../../src/state/initial';
import type { Decision, RealMaturityLevel } from '../../src/state/types';

const backed = (level: number, basedOn = 1): LevelView => ({ dimension: 'datos', justification: 'j', derivesFrom: ['R1'], status: 'backed', level, basedOn, backing: ['R1'] });
const insufficient: LevelView = { dimension: 'cultura', justification: '', derivesFrom: [], status: 'insufficient', basedOn: 0, backing: [] };
const noBacking: LevelView = { dimension: 'talento', justification: 'j', derivesFrom: ['R4'], status: 'no-backing', reason: 'pending', basedOn: 0, backing: [] };
const html = (v: Parameters<typeof ScaleBar>[0]) => renderToStaticMarkup(createElement(ScaleBar, v));

describe('barra de madurez: valor → ancho y etiqueta', () => {
  it('escala 1 a 5: el ancho es valor/5', () => {
    expect(levelBar(backed(3))).toMatchObject({ kind: 'value', value: 3, percent: 60, low: false });
    expect(levelBar(backed(5))).toMatchObject({ percent: 100 });
    expect(levelBar(backed(2))).toMatchObject({ percent: 40, low: false });
  });
  it('por debajo de 2 es «Bajo (<2)»; con 2 no', () => {
    expect(LOW_LABEL).toBe('Bajo (<2)');
    expect(levelBar(backed(1))).toMatchObject({ low: true, percent: 20 });
    const m = html({ view: levelBar(backed(1)), name: 'Datos' });
    expect(m).toContain('Bajo (&lt;2)');
    expect(m).toContain('scale-fill-low');
    expect(html({ view: levelBar(backed(2)), name: 'Datos' })).not.toContain('Bajo');
  });
  it('lleva role="img", aria-label con el nombre, el valor y «basado en N», y la marca en 2', () => {
    const m = html({ view: levelBar(backed(3, 2)), name: 'Datos' });
    expect(m).toContain('role="img"');
    expect(m).toContain('aria-label="Datos: nivel 3 de 5, basado en 2 hallazgos"');
    expect(m).toContain('style="width:60%"');
    expect(m).toContain('basado en 2 hallazgos');
    expect(m).toContain('scale-mark');
    expect(m).toContain('left:40%');
  });
  it('el color nunca es el único dato: el valor y la etiqueta salen en texto', () => {
    expect(html({ view: levelBar(backed(4)), name: 'Datos' })).toMatch(/4 de 5/);
  });
});

describe('«Sin evidencia suficiente» y «Sin respaldo vigente»: barra vacía rayada, NUNCA con un número', () => {
  it('sin evidencia', () => {
    const v = levelBar(insufficient);
    expect(v).toEqual({ kind: 'empty', label: 'Sin evidencia suficiente', basedText: 'basado en 0 hallazgos' });
    const m = html({ view: v, name: 'Cultura' });
    expect(m).toContain('Sin evidencia suficiente');
    expect(m).toContain('scale-empty');
    expect(m).not.toContain('style="width');
    expect(m).not.toMatch(/\d\s*de\s*5/);
    expect(m).not.toContain('scale-fill');
    expect(m).toContain('aria-label="Cultura: Sin evidencia suficiente, basado en 0 hallazgos"');
  });
  it('sin respaldo vigente', () => {
    const m = html({ view: levelBar(noBacking), name: 'Talento' });
    expect(m).toContain('Sin respaldo vigente');
    expect(m).toContain('scale-empty');
    expect(m).not.toMatch(/\d\s*de\s*5/);
    expect(m).not.toContain('scale-fill');
  });
  it('el panel dibuja 6 barras y solo las respaldadas llevan número; las demás, etiqueta', () => {
    const maturity: RealMaturityLevel[] = [{ dimension: 'datos', level: 2, insufficient: false, justification: 'j', derivesFrom: ['R1'] }];
    const decisions: Record<string, Decision> = { R1: { state: 'accepted' } };
    const ev = evaluateMaturity(maturity, [{ id: 'R1', verified: true }], decisions);
    const m = renderToStaticMarkup(createElement(MaturityPanel, { evaluation: ev }));
    expect((m.match(/class="scale-bar/g) ?? []).length).toBe(6);
    expect((m.match(/scale-fill/g) ?? []).length).toBeGreaterThan(0);
    expect((m.match(/scale-empty/g) ?? []).length).toBe(5);
    expect(m).toContain('Nivel 2 de 5'); // los textos actuales se conservan
    expect(m).toContain('Deriva de: R1');
  });
});

describe('tarjeta del nivel general', () => {
  const card = (index: number | null, mode: 'real' | 'simulated') => renderToStaticMarkup(createElement(MaturityIndexCard, { index, mode }));
  it('real: «N de 5», rótulo «estimado por IA» y 5 segmentos', () => {
    const m = card(3, 'real');
    expect(m).toContain('3,0 de 5');
    expect(m).toContain('estimado por IA');
    expect((m.match(/class="segment/g) ?? []).length).toBe(5);
    expect(m).toContain('aria-label="Nivel general: 3,0 de 5"');
  });
  it('simulado: rótulo «ilustrativo, ficticio»', () => {
    const m = card(2.4, 'simulated');
    expect(m).toContain('2,4 de 5');
    expect(m).toContain('ilustrativo, ficticio');
    expect(m).not.toContain('estimado por IA');
  });
  it('sin índice: «—» y «Sin evidencia suficiente», sin número ni relleno', () => {
    const m = card(null, 'real');
    expect(m).toContain('—');
    expect(m).toContain('Sin evidencia suficiente');
    expect(m).not.toMatch(/\d(,\d)? de 5/);
    expect(m).not.toContain('segment-fill');
    expect(m).not.toContain('estimado por IA');
  });
  it('los segmentos se llenan en proporción: 2,5 → 1, 1, 0,5, 0, 0', () => {
    expect(segmentFills(2.5)).toEqual([1, 1, 0.5, 0, 0]);
    expect(segmentFills(null)).toEqual([0, 0, 0, 0, 0]);
    expect(segmentFills(5)).toEqual([1, 1, 1, 1, 1]);
  });
  it('no usa nombres de nivel inventados: solo el número', () => {
    for (const n of [1, 2, 3, 4, 5]) expect(card(n, 'real')).not.toMatch(/inicial|emergente|b[aá]sico|avanzado|experto|optimizad/i);
  });
});

describe('cifras de la revisión', () => {
  const findings = [
    { id: 'H1', verified: true },
    { id: 'H2', verified: true },
    { id: 'H3', verified: false },
    { id: 'H4', verified: true },
    { id: 'H5', verified: true },
  ];
  const decisions: Record<string, Decision> = { H1: { state: 'accepted' }, H2: { state: 'edited', text: 'x' }, H3: { state: 'accepted' }, H4: { state: 'rejected' } };
  it('cuenta hallazgos, aceptados o editados, rechazados, pendientes y NO VERIFICADO', () => {
    expect(reviewStats(findings, decisions)).toEqual({ total: 5, accepted: 2, edited: 1, adopted: 3, rejected: 1, pending: 1, unverified: 1 });
  });
  it('sin decisiones todo está pendiente', () => {
    expect(reviewStats(findings, {})).toMatchObject({ total: 5, adopted: 0, rejected: 0, pending: 5 });
  });
  it('el componente muestra las cifras en texto y una barra segmentada con role="img"', () => {
    const m = renderToStaticMarkup(createElement(ReviewStats, { findings, decisions }));
    for (const id of ['stat-total', 'stat-adopted', 'stat-rejected', 'stat-pending', 'stat-unverified']) expect(m).toContain(`data-testid="${id}"`);
    expect(m).toContain('role="img"');
    expect(m).toContain('aria-label="Estado de la revisión: 3 aceptados o editados, 1 rechazado, 1 pendiente"');
    expect(m).toContain('NO VERIFICADO');
  });
});

describe('promedio por pilar en el tablero', () => {
  it('sin proyectos reales emitidos, ninguna dimensión tiene número', () => {
    const rows = pillarAverages(createInitialState());
    expect(rows).toHaveLength(6);
    for (const r of rows) expect(r).toMatchObject({ value: null, projects: 0 });
    expect(averageBar(null, 0)).toEqual({ kind: 'empty', label: 'Sin evidencia suficiente', basedText: 'basado en 0 proyectos' });
  });
  it('promedia solo niveles con respaldo vigente de proyectos reales emitidos', () => {
    const s = createInitialState();
    const ps = s.projects['P-A'];
    ps.mode = 'real';
    ps.diagnosis = { status: 'issued', issuedAt: '2026-11-14T10:00:00.000Z', decisions: { R1: { state: 'accepted' }, R2: { state: 'accepted' } } };
    ps.real = {
      findings: [
        { id: 'R1', dimension: 'datos', title: 't', text: 't', verified: true, citations: [], origin: 'agent' },
        { id: 'R2', dimension: 'datos', title: 't', text: 't', verified: true, citations: [], origin: 'agent' },
      ],
      missingInfo: [],
      objections: [],
      maturity: [{ dimension: 'datos', level: 4, insufficient: false, justification: 'j', derivesFrom: ['R1', 'R2'] }],
    };
    const datos = pillarAverages(s).find((r) => r.dimension === 'datos')!;
    expect(datos).toEqual({ dimension: 'datos', value: 4, projects: 1 });
    expect(averageBar(4, 1)).toMatchObject({ kind: 'value', percent: 80, low: false, basedText: 'basado en 1 proyecto' });
    expect(averageBar(1.5, 2)).toMatchObject({ low: true });
  });
});

describe('la sección de promedio por pilar solo existe con un proyecto real emitido', () => {
  it('con solo los datos de ejemplo no hay ninguno', () => {
    expect(hasRealIssued(createInitialState())).toBe(false);
  });
  it('un proyecto real sin emitir tampoco cuenta; uno simulado emitido tampoco', () => {
    const s = createInitialState();
    s.projects['P-A'].mode = 'real';
    s.projects['P-A'].diagnosis = { status: 'generated', decisions: {} };
    expect(hasRealIssued(s)).toBe(false);
    expect(s.projects['P-B'].diagnosis.status).toBe('issued'); // simulado y emitido
    expect(s.projects['P-B'].mode).toBeUndefined();
    expect(hasRealIssued(s)).toBe(false);
  });
  it('un proyecto real con diagnóstico emitido sí', () => {
    const s = createInitialState();
    s.projects['P-A'].mode = 'real';
    s.projects['P-A'].diagnosis = { status: 'issued', issuedAt: '2026-11-14T10:00:00.000Z', decisions: {} };
    expect(hasRealIssued(s)).toBe(true);
  });
});
