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
    for (const a of [STRATEGY.sector, STRATEGY.market]) {
      expect(a.summary.split(/(?<=[.])\s+/).length).toBeGreaterThanOrEqual(2);
      expect(a.summary.split(/(?<=[.])\s+/).length).toBeLessThanOrEqual(3);
      expect(a.keyPoints).toHaveLength(3);
      expect(a.implication.supportedBy.length).toBeGreaterThan(0);
      a.implication.supportedBy.forEach((id) => expect(ids.has(id)).toBe(true));
      expect(a.sources).toBe('Fuentes: ninguna en esta demostración; en el sistema real se citarán fuentes externas con fecha.');
      expect(JSON.stringify({ ...a, implication: a.implication.text })).not.toMatch(/\d/); // sin cifras ni porcentajes
    }
  });
});

describe('análisis de sector y de mercado derivados (FR-026)', () => {
  it('con todo aceptado muestra la implicación con «Deriva de» sin el hallazgo NO VERIFICADO', () => {
    const d = derive(all(A));
    for (const a of [d.sector, d.market]) {
      expect(a.implication).not.toBeNull();
      expect(a.implication!.derivedFrom).not.toContain('H5');
    }
  });
  it('un hallazgo rechazado no respalda la implicación', () => {
    const d = derive({ ...all(A), H1: R, H6: R });
    expect(d.sector.implication).toBeNull();
    expect(d.market.implication!.derivedFrom).not.toContain('H1');
    const d2 = derive({ ...all(A), H2: R });
    expect(d2.market.implication!.derivedFrom).not.toContain('H2');
  });
  it('un hallazgo NO VERIFICADO aceptado no respalda la implicación: sin otros respaldos, no se muestra', () => {
    const solo = Object.fromEntries(STRATEGY.market.implication.supportedBy.map((id) => [id, id === 'H5' ? A : R]));
    const d = derive({ ...all(R), ...solo });
    expect(STRATEGY.market.implication.supportedBy).toContain('H5');
    expect(d.market.implication).toBeNull();
  });
  it('resumen y puntos clave siguen presentes aunque no haya implicación', () => {
    const d = derive(all(R));
    expect(d.sector.summary.length).toBeGreaterThan(0);
    expect(d.sector.keyPoints).toHaveLength(3);
    expect(d.sector.implication).toBeNull();
  });
  it('un estado vacío de la estrategia no oculta los análisis (siguen siendo de solo lectura)', () => {
    expect(derive(all(R)).empty).toBe(true);
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
