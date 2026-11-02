import { describe, expect, it } from 'vitest';
import { DIAGNOSIS } from '../../src/data/diagnosis';
import { STRATEGY } from '../../src/data/strategy';
import { deriveStrategy } from '../../src/domain/strategy';
import type { Decision } from '../../src/state/types';

const A: Decision = { state: 'accepted' };
const E: Decision = { state: 'edited', text: 'x' };
const R: Decision = { state: 'rejected' };
const all = (d: Decision): Record<string, Decision> => Object.fromEntries(DIAGNOSIS.findings.map((f) => [f.id, d]));
const derive = (decisions: Record<string, Decision>) => deriveStrategy(STRATEGY, DIAGNOSIS.findings, decisions);

describe('plantilla de estrategia', () => {
  it('4 riesgos con nivel y 4 fases con horizonte; todo apunta a hallazgos que existen', () => {
    expect(STRATEGY.risks).toHaveLength(4);
    expect(STRATEGY.route).toHaveLength(4);
    const ids = new Set(DIAGNOSIS.findings.map((f) => f.id));
    for (const r of STRATEGY.risks) {
      expect(['alto', 'medio', 'bajo']).toContain(r.level);
      expect(r.supportedBy.length).toBeGreaterThan(0);
      r.supportedBy.forEach((id) => expect(ids.has(id)).toBe(true));
    }
    for (const f of STRATEGY.route) {
      expect(f.horizon).toBeTruthy();
      f.supportedBy.forEach((id) => expect(ids.has(id)).toBe(true));
    }
    expect(STRATEGY.sectorAnalysis.length).toBeGreaterThan(0);
    expect(STRATEGY.marketAnalysis.length).toBeGreaterThan(0);
  });
});

describe('deriveStrategy (FR-024, FR-025, SC-012)', () => {
  it('con todo aceptado, un hallazgo NO VERIFICADO no figura en ningún «Deriva de»', () => {
    const d = derive(all(A));
    const used = [...d.risks, ...d.route].flatMap((x) => x.derivedFrom);
    expect(used).not.toContain('H5');
    expect(d.unverifiedAdopted).toBe(1);
  });
  it('un elemento aparece solo si tiene ≥ 1 hallazgo de respaldo aceptado o editado y verificado', () => {
    const decisions = { ...all(R), H1: A, H2: E };
    const d = derive(decisions);
    for (const x of [...d.risks, ...d.route]) {
      expect(x.derivedFrom.length).toBeGreaterThan(0);
      x.derivedFrom.forEach((id) => expect(['H1', 'H2']).toContain(id));
    }
    expect(d.risks.length).toBeLessThan(STRATEGY.risks.length);
  });
  it('nada deriva de un hallazgo rechazado ni pendiente', () => {
    const d = derive({ ...all(A), H2: R, H7: { state: 'pending' } });
    const used = [...d.risks, ...d.route].flatMap((x) => x.derivedFrom);
    expect(used).not.toContain('H2');
    expect(used).not.toContain('H7');
  });
  it('un elemento cuyo único respaldo es un NO VERIFICADO no se muestra', () => {
    const only5 = { ...all(R), H5: A };
    const d = derive(only5);
    expect(d.risks).toEqual([]);
    expect(d.route).toEqual([]);
    expect(d.empty).toBe(true);
    expect(d.unverifiedAdopted).toBe(1);
  });
  it('estrategia vacía cuando ningún elemento tiene respaldo', () => {
    expect(derive(all(R)).empty).toBe(true);
    expect(derive(all(A)).empty).toBe(false);
  });
  it('derivedFrom conserva el orden de la plantilla y no repite', () => {
    const d = derive(all(A));
    for (const x of [...d.risks, ...d.route]) expect(new Set(x.derivedFrom).size).toBe(x.derivedFrom.length);
  });
});
