import { describe, expect, it } from 'vitest';
import { EVIDENCE_SLOTS } from '../../src/data/evidence';
import { CAPTURE_QUESTIONS } from '../../src/data/questions';
import { COMPANIES } from '../../src/data/companies';
import { PROJECTS } from '../../src/data/projects';
import { buildEvidenceItems } from '../../src/domain/evidence';

describe('evidencia de ejemplo (5 ranuras)', () => {
  it('hay 5 ranuras con ids únicos y extractos con ubicación', () => {
    expect(EVIDENCE_SLOTS.map((s) => s.slot)).toEqual([1, 2, 3, 4, 5]);
    const excerptIds = EVIDENCE_SLOTS.flatMap((s) => s.excerpts.map((e) => e.id));
    expect(new Set(excerptIds).size).toBe(excerptIds.length);
    for (const s of EVIDENCE_SLOTS) {
      expect(s.excerpts.length).toBeGreaterThan(0);
      for (const e of s.excerpts) {
        expect(e.slot).toBe(s.slot);
        expect(e.locator).toMatch(/^(min \d+:\d{2}|pág\. \d+)$/);
        expect(e.text.length).toBeGreaterThan(10);
      }
    }
  });
  it('todo proyecto usa solo ranuras 1 a 5 y P-D no muestra ninguna', () => {
    for (const p of PROJECTS) for (const s of p.sampleSlots) expect([1, 2, 3, 4, 5]).toContain(s);
    expect(PROJECTS.find((p) => p.id === 'P-D')!.sampleSlots).toEqual([]);
  });
  it('la ranura 5 está «procesando» en algunos proyectos pero no en todos', () => {
    const withPending = PROJECTS.filter((p) => p.pendingSlots.includes(5));
    expect(withPending.length).toBeGreaterThan(0);
    expect(withPending.length).toBeLessThan(PROJECTS.length);
    for (const p of PROJECTS) for (const s of p.pendingSlots) expect(p.sampleSlots).toContain(s);
  });
});

describe('preguntas de captura', () => {
  it('ids únicos y los select traen opciones', () => {
    const ids = CAPTURE_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of CAPTURE_QUESTIONS) if (q.kind === 'select') expect(q.options!.length).toBeGreaterThan(1);
  });
});

describe('buildEvidenceItems', () => {
  const company = (id: string) => COMPANIES.find((c) => c.id === PROJECTS.find((p) => p.id === id)!.companyId)!.name;
  it('P-A: 5 elementos de ejemplo con el nombre de la empresa, el 5 procesando', () => {
    const items = buildEvidenceItems(PROJECTS.find((p) => p.id === 'P-A')!, company('P-A'), []);
    expect(items).toHaveLength(5);
    expect(items.every((i) => i.origin === 'ejemplo')).toBe(true);
    expect(items.some((i) => i.name.includes('{empresa}'))).toBe(false);
    expect(items.some((i) => i.name.includes('Empresa Ficticia'))).toBe(true);
    expect(items.find((i) => i.id === 'slot-5')!.processing).toBe(true);
  });
  it('P-D sin archivos: ningún elemento', () => {
    expect(buildEvidenceItems(PROJECTS.find((p) => p.id === 'P-D')!, company('P-D'), [])).toEqual([]);
  });
  it('los archivos propios se clasifican por extensión y se marcan como propios', () => {
    const items = buildEvidenceItems(PROJECTS.find((p) => p.id === 'P-D')!, company('P-D'), [
      { id: 'f1', name: 'x.pdf', type: 'application/pdf', size: 1, addedAt: '2026-11-01T10:00:00Z' },
      { id: 'f2', name: 'y.vtt', type: '', size: 1, addedAt: '2026-11-01T10:00:00Z' },
    ]);
    expect(items.map((i) => [i.origin, i.kind])).toEqual([
      ['propio', 'documento'],
      ['propio', 'transcripcion'],
    ]);
    expect(items[0].file?.id).toBe('f1');
  });
});
