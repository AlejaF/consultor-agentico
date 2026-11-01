import { describe, expect, it } from 'vitest';
import { DIAGNOSIS } from '../../src/data/diagnosis';
import { EVIDENCE_SLOTS } from '../../src/data/evidence';

const DIMENSIONS = ['estrategia', 'infraestructura', 'datos', 'gobernanza', 'talento', 'cultura'];

describe('plantilla de diagnóstico', () => {
  it('tiene 8 hallazgos con ids únicos y las 6 dimensiones', () => {
    expect(DIAGNOSIS.findings).toHaveLength(8);
    expect(new Set(DIAGNOSIS.findings.map((f) => f.id)).size).toBe(8);
    expect(new Set(DIAGNOSIS.findings.map((f) => f.dimension))).toEqual(new Set(DIMENSIONS));
  });
  it('todo hallazgo tiene ≥ 1 cita y toda cita resuelve a una ranura y un extracto existentes', () => {
    for (const f of DIAGNOSIS.findings) {
      expect(f.citations.length, f.id).toBeGreaterThanOrEqual(1);
      for (const c of f.citations) {
        const slot = EVIDENCE_SLOTS.find((s) => s.slot === c.slot);
        expect(slot, `${f.id} ranura ${c.slot}`).toBeDefined();
        expect(slot!.excerpts.some((e) => e.id === c.excerptId), `${f.id} ${c.excerptId}`).toBe(true);
      }
    }
  });
  it('exactamente un hallazgo no verificado, con su razón', () => {
    const unverified = DIAGNOSIS.findings.filter((f) => !f.verified);
    expect(unverified).toHaveLength(1);
    expect(unverified[0].unverifiedReason).toMatch(/\S/);
    for (const f of DIAGNOSIS.findings.filter((x) => x.verified)) expect(f.unverifiedReason).toBeUndefined();
  });
  it('índice de madurez entre 1 y 5; textos no vacíos', () => {
    expect(DIAGNOSIS.maturityIndex).toBeGreaterThanOrEqual(1);
    expect(DIAGNOSIS.maturityIndex).toBeLessThanOrEqual(5);
    for (const f of DIAGNOSIS.findings) {
      expect(f.title.length).toBeGreaterThan(5);
      expect(f.text.length).toBeGreaterThan(20);
    }
  });
});
