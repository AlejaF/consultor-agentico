// Lote H2 (AG-034): composición. Pruebas estructurales (no de píxeles): sin duplicados, «Sin evidencia» sin número y dicho una vez,
// el rótulo de IA unido al encabezado del bloque y una sola escala 1–5 compartida.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MaturityPanel, shortJustification } from '../../src/components/MaturityPanel';
import { ScaleBar } from '../../src/components/ScaleBar';
import { evaluateMaturity } from '../../src/domain/maturity';
import { levelBar } from '../../src/domain/visual';
import type { Decision, RealMaturityLevel } from '../../src/state/types';

const maturity: RealMaturityLevel[] = [
  { dimension: 'datos', level: 2, insufficient: false, justification: 'Las cifras viven en cada área.', derivesFrom: ['R1'] },
  { dimension: 'infraestructura', level: 1, insufficient: false, justification: 'Sistemas aislados.', derivesFrom: ['R2'] },
];
const findings = [{ id: 'R1', verified: true }, { id: 'R2', verified: true }];
const decisions: Record<string, Decision> = { R1: { state: 'accepted' }, R2: { state: 'accepted' } };
const panel = (d: Record<string, Decision> = decisions) => renderToStaticMarkup(createElement(MaturityPanel, { evaluation: evaluateMaturity(maturity, findings, d) }));
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

describe('madurez real: composición en dos columnas sin duplicados', () => {
  it('hay una tarjeta de nivel general y una lista de barras, una al lado de la otra', () => {
    const m = panel();
    expect(m).toContain('maturity-layout');
    expect(count(m, /data-testid="maturity-card"/g)).toBe(1);
    expect(count(m, /class="maturity-bars/g)).toBe(1);
  });
  it('el índice aparece una sola vez (sin la línea suelta «Índice de madurez» duplicada)', () => {
    const m = panel();
    expect(count(m, /Índice de madurez/g)).toBe(1);
    expect(count(m, /data-testid="maturity-index"/g)).toBe(1);
    expect(count(m, /data-testid="maturity-card-value"/g)).toBe(1);
    expect(m).toContain('Calculado por código a partir de niveles propuestos por IA');
  });
  it('la tarjeta dice «basado en N hallazgos aceptados» y «estimado por IA»', () => {
    const m = panel();
    expect(m).toContain('estimado por IA');
    expect(m).toMatch(/basado en 2 hallazgos aceptados/);
  });
  it('una sola escala 1–5 compartida: un eje para toda la lista y ninguno dentro de las filas', () => {
    const m = panel();
    expect(count(m, /class="scale-axis/g)).toBe(1);
    expect(count(m, /class="scale-ticks/g)).toBe(0);
  });
  it('las filas son compactas: nombre, barra y valor; la justificación y «Deriva de» van en un detalle', () => {
    const m = panel();
    expect(count(m, /<details/g)).toBeGreaterThanOrEqual(2);
    expect(m).toContain('Las cifras viven en cada área.');
    expect(m).toContain('Deriva de: R1');
  });
  it('el rótulo de IA va UNIDO al encabezado del bloque, una sola vez; las filas no lo repiten', () => {
    const m = panel();
    expect(count(m, /Generado por IA · requiere revisión humana/g)).toBe(1);
    expect(m).toMatch(/class="block-head[^"]*"[^>]*>.*Madurez por dimensión.*Generado por IA/s);
  });
  it('«Sin evidencia suficiente» se dice una vez por fila (más su aria-label) y NUNCA con número ni ancho', () => {
    const m = panel();
    const row = m.split('data-testid="maturity-level-cultura"')[1]!.split('</li>')[0]!;
    expect(count(row, /Sin evidencia suficiente/g)).toBe(2); // etiqueta visible + aria-label de la barra
    expect(count(row, /class="scale-label/g)).toBe(1);
    expect(row).not.toMatch(/\d\s*de\s*5/);
    expect(row).not.toContain('scale-fill');
    expect(row).toContain('scale-empty');
  });
  it('«Bajo (<2)» se mantiene en la fila de nivel 1', () => {
    expect(panel().split('data-testid="maturity-level-infraestructura"')[1]!.split('</li>')[0]).toContain('Bajo (&lt;2)');
  });
});

describe('línea corta, chips y detalle', () => {
  it('cada dimensión respaldada deja visibles la línea corta y los chips con los ids', () => {
    const m = panel();
    expect(m).toContain('class="row-just"');
    expect(m).toMatch(/class="badge chip-id">R1</);
  });
  it('la línea corta es la primera frase y no pasa de 90 caracteres', () => {
    expect(shortJustification('Primera frase. Segunda frase.')).toBe('Primera frase.');
    expect(shortJustification('x'.repeat(200)).length).toBeLessThanOrEqual(90);
    expect(shortJustification('x'.repeat(200)).endsWith('…')).toBe(true);
  });
  it('el informe imprimible abre los detalles (`open`); la pantalla los deja cerrados', () => {
    const ev = evaluateMaturity(maturity, findings, decisions);
    expect(renderToStaticMarkup(createElement(MaturityPanel, { evaluation: ev, openDetails: true }))).toMatch(/<details class="row-detail" open=""/);
    expect(renderToStaticMarkup(createElement(MaturityPanel, { evaluation: ev }))).not.toMatch(/<details class="row-detail" open/);
  });
});

describe('barra compacta', () => {
  it('sin eje propio; mantiene role="img", aria-label y la marca en 2', () => {
    const m = renderToStaticMarkup(createElement(ScaleBar, { view: levelBar({ dimension: 'datos', justification: '', derivesFrom: ['R1'], status: 'backed', level: 3, basedOn: 1, backing: ['R1'] }), name: 'Datos', compact: true }));
    expect(m).toContain('scale-compact');
    expect(m).not.toContain('scale-ticks');
    expect(m).toContain('role="img"');
    expect(m).toContain('left:40%');
  });
});
