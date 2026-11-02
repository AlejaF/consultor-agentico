import { describe, expect, it } from 'vitest';
import { DIAGNOSIS } from '../../src/data/diagnosis';
import { reportContent } from '../../src/domain/report';
import type { Decision, DiagnosisState, StrategyState } from '../../src/state/types';

const A: Decision = { state: 'accepted' };
const R: Decision = { state: 'rejected' };
const E: Decision = { state: 'edited', text: 'Texto editado ficticio' };
// P-B de ejemplo: H5 (NO VERIFICADO) aceptado, H2 editado, H4 rechazado, el resto aceptado
const decisions: Record<string, Decision> = { H1: A, H2: E, H3: A, H4: R, H5: A, H6: A, H7: A, H8: A };
const issued: DiagnosisState = { status: 'issued', decisions, issuedAt: '2026-11-01T10:00:00.000Z' };
const generatedDx: DiagnosisState = { status: 'generated', decisions: {} };
const none: StrategyState = { status: 'none' };
const generated: StrategyState = { status: 'generated' };
const sent: StrategyState = { status: 'sent', sentAt: '2026-11-01T11:00:00.000Z' };

describe('reportContent (FR-044 a FR-046)', () => {
  it('solo está disponible con el diagnóstico emitido', () => {
    for (const scope of ['consultor', 'dx', 'st'] as const) {
      const r = reportContent(generatedDx, sent, scope);
      expect(r.available).toBe(false);
    }
    expect(reportContent({ status: 'none', decisions: {} }, none, 'consultor').available).toBe(false);
    expect(reportContent(issued, none, 'consultor').available).toBe(true);
  });

  it('incluye solo hallazgos aceptados o editados, con texto editado y cuenta los excluidos', () => {
    const r = reportContent(issued, none, 'consultor');
    if (!r.available) throw new Error('debe estar disponible');
    expect(r.findings.map((f) => f.finding.id)).toEqual(['H1', 'H2', 'H3', 'H5', 'H6', 'H7', 'H8']);
    expect(r.findings.find((f) => f.finding.id === 'H2')!.editedText).toBe('Texto editado ficticio');
    expect(r.excluded).toBe(1);
    expect(r.findings).toHaveLength(DIAGNOSIS.findings.length - r.excluded);
  });

  it('marca NO VERIFICADO lo que lo es y lo cuenta', () => {
    const r = reportContent(issued, none, 'consultor');
    if (!r.available) throw new Error('debe estar disponible');
    expect(r.findings.filter((f) => !f.finding.verified).map((f) => f.finding.id)).toEqual(['H5']);
    expect(r.unverifiedShown).toBe(1);
  });

  it('no incluye calificaciones ni comentarios del Líder', () => {
    const r = reportContent(issued, sent, 'st');
    expect(JSON.stringify(r)).not.toMatch(/grading|calificaci|comment/i);
  });

  it('consultor: sin estrategia generada → nota «Estrategia aún no disponible»; con estrategia generada, la incluye', () => {
    const sin = reportContent(issued, none, 'consultor');
    if (!sin.available) throw new Error('x');
    expect(sin.strategy).toEqual({ kind: 'unavailable', note: 'Estrategia aún no disponible' });
    const con = reportContent(issued, generated, 'consultor');
    if (!con.available) throw new Error('x');
    expect(con.strategy.kind).toBe('derived');
  });

  it('dx: solo el diagnóstico, aunque exista estrategia generada o enviada', () => {
    for (const s of [none, generated, sent]) {
      const r = reportContent(issued, s, 'dx');
      if (!r.available) throw new Error('x');
      expect(r.strategy).toEqual({ kind: 'omitted' });
    }
  });

  it('st: la estrategia enviada con su diagnóstico; nunca una generada pero no enviada', () => {
    const ok = reportContent(issued, sent, 'st');
    if (!ok.available) throw new Error('x');
    expect(ok.strategy.kind).toBe('derived');
    expect(reportContent(issued, generated, 'st').available).toBe(false);
    expect(reportContent(issued, none, 'st').available).toBe(false);
  });

  it('la estrategia solo usa hallazgos aceptados o editados y verificados', () => {
    const r = reportContent(issued, sent, 'st');
    if (!r.available || r.strategy.kind !== 'derived') throw new Error('x');
    const ids = r.strategy.derived.risks.map((x) => x.id);
    expect(ids).not.toContain('R2'); // sus respaldos: H4 rechazado y H5 NO VERIFICADO
    expect(r.strategy.derived.unverifiedAdopted).toBe(1);
  });
});
