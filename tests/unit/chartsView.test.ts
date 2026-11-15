// Lote H3 (AG-035): los componentes de gráfico no dibujan números donde no hay evidencia y siempre traen tabla equivalente y valor en texto.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChartFrame, DotMatrix, Heatmap, Meter, RankedBars, SegmentedBar } from '../../src/components/charts';
import { evidenceCoverage, maturityByProject, provenanceMatrix, reviewSegments } from '../../src/domain/charts';
import { reviewStats } from '../../src/domain/visual';
import type { Decision } from '../../src/state/types';

const cite = (file: string) => ({ file });
const A: Decision = { state: 'accepted' };
const coverage = evidenceCoverage([{ id: 'R1', dimension: 'datos', verified: true, realCitations: [cite('a.txt'), cite('b.pdf')] }], { R1: A });

describe('Heatmap', () => {
  it('una celda sin evidencia dice «sin evidencia» y NO lleva número', () => {
    const html = renderToStaticMarkup(createElement(Heatmap, { data: coverage }));
    const empties = [...html.matchAll(/<td class="heat-cell heat-empty"[^>]*>(.*?)<\/td>/g)];
    expect(empties.length).toBeGreaterThan(0);
    for (const m of empties) {
      expect(m[1]).toContain('sin evidencia');
      expect(m[1]).not.toMatch(/\d/);
    }
  });
  it('la celda con hallazgos vigentes lleva su cifra y su tooltip de teclado (tabindex)', () => {
    const html = renderToStaticMarkup(createElement(Heatmap, { data: coverage }));
    expect(html).toMatch(/heat-l\d" data-tip="Datos · a\.txt: 1 hallazgo vigente" tabindex="0">1</);
  });
  it('un hallazgo rechazado no pinta ninguna celda', () => {
    const c = evidenceCoverage([{ id: 'R1', dimension: 'datos', verified: true, realCitations: [cite('a.txt')] }], { R1: { state: 'rejected' } });
    const html = renderToStaticMarkup(createElement(Heatmap, { data: c }));
    expect(html).not.toMatch(/heat-l\d/);
  });
});

describe('ChartFrame', () => {
  it('trae título, valor en texto y «Ver como tabla»', () => {
    const html = renderToStaticMarkup(createElement(ChartFrame, { testId: 'x', title: '¿Pregunta?', summary: 'Valor en texto', table: { caption: 'c', head: ['a', 'b'], rows: [['1', 2]] }, children: null }));
    expect(html).toContain('¿Pregunta?');
    expect(html).toContain('Valor en texto');
    expect(html).toContain('Ver como tabla');
    expect(html).toContain('<table');
  });
});

describe('SegmentedBar, RankedBars, Meter, DotMatrix', () => {
  it('la barra segmentada lista cada parte con su cifra y marca el segmento enfocable', () => {
    const r = reviewSegments(reviewStats([{ id: 'a', verified: true }, { id: 'b', verified: true }], { a: A }));
    const html = renderToStaticMarkup(createElement(SegmentedBar, { parts: r.parts, total: r.total, name: 'Revisión' }));
    expect(html).toContain('Aceptados</span> <strong>1</strong>');
    expect(html).toContain('tabindex="0"');
  });
  it('las barras ordenadas rotulan «ilustrativo» a los simulados', () => {
    const m = maturityByProject([{ id: 'x', name: 'X', mode: 'simulated', index: 2 }, { id: 'y', name: 'Y', mode: 'real', index: 3 }]);
    const html = renderToStaticMarkup(createElement(RankedBars, { bars: m.bars, name: 'm' }));
    expect(html.match(/ilustrativo/g)!.length).toBeGreaterThanOrEqual(2);
    expect(html.indexOf('>Y<')).toBeLessThan(html.indexOf('>X<'));
  });
  it('el medidor sin tope NO dibuja relleno ni porcentaje', () => {
    const html = renderToStaticMarkup(createElement(Meter, { value: 4, max: null, percent: null, label: 'Iteraciones' }));
    expect(html).not.toContain('meter-fill');
    expect(html).toContain('tope no disponible');
  });
  it('la matriz de puntos marca los hallazgos aceptados que nadie usa', () => {
    const m = provenanceMatrix([{ id: 'E1', label: 'Riesgo', kind: 'riesgo', derivedFrom: ['R1'] }], [{ id: 'R1', verified: true }, { id: 'R2', verified: true }], { R1: A, R2: A });
    const html = renderToStaticMarkup(createElement(DotMatrix, { data: m }));
    expect(html).toContain('sin uso');
  });
});
