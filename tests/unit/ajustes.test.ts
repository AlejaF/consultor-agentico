import { describe, expect, it } from 'vitest';
import { DIAGNOSIS } from '../../src/data/diagnosis';
import { EVIDENCE_SLOTS } from '../../src/data/evidence';
import { countUnverifiedAdopted, usesAsSupport } from '../../src/domain/review';
import { flowSteps } from '../../src/domain/flow';
import { navItemsFor } from '../../src/app/navItems';
import type { Decision } from '../../src/state/types';

const A: Decision = { state: 'accepted' };
const E: Decision = { state: 'edited', text: 'x' };
const R: Decision = { state: 'rejected' };
const findings = [
  { id: 'H1', verified: true },
  { id: 'H5', verified: false },
  { id: 'H9', verified: false },
];

describe('Ajuste F: NO VERIFICADO adoptado no respalda la estrategia', () => {
  it('cuenta solo los NO VERIFICADO aceptados o editados', () => {
    expect(countUnverifiedAdopted(findings, { H1: A, H5: A, H9: E })).toBe(2);
    expect(countUnverifiedAdopted(findings, { H1: A, H5: R, H9: { state: 'pending' } })).toBe(0);
    expect(countUnverifiedAdopted(findings, {})).toBe(0);
  });
  it('usesAsSupport: solo aceptado/editado y verificado', () => {
    expect(usesAsSupport(true, 'accepted')).toBe(true);
    expect(usesAsSupport(true, 'edited')).toBe(true);
    expect(usesAsSupport(false, 'accepted')).toBe(false);
    expect(usesAsSupport(true, 'rejected')).toBe(false);
    expect(usesAsSupport(true, 'pending')).toBe(false);
  });
});

describe('Ajuste H: el hallazgo y su extracto dicen lo mismo', () => {
  it('H4 y S1-E1 usan «consolidan»', () => {
    const h4 = DIAGNOSIS.findings.find((f) => f.id === 'H4')!;
    const excerpt = EVIDENCE_SLOTS.flatMap((s) => s.excerpts).find((e) => e.id === 'S1-E1')!;
    expect(h4.text).toContain('se consolidan');
    expect(excerpt.text).toContain('se consolidan');
    expect(h4.text + excerpt.text).not.toMatch(/reconcil|concilian/);
  });
});

describe('Ajuste I: la Estrategia queda «Disponible» con el diagnóstico emitido', () => {
  const base = { evidenceCount: 3, hasAnswers: false, diagnosis: 'issued' as const, reviewed: 8, strategy: 'none' as const };
  it('emitido y sin generar: Disponible; generada: En curso; enviada: Completado', () => {
    expect(flowSteps(base)[3].status).toBe('Disponible');
    expect(flowSteps({ ...base, strategy: 'generated' })[3].status).toBe('En curso');
    expect(flowSteps({ ...base, strategy: 'sent' })[3].status).toBe('Completado');
    expect(flowSteps({ ...base, diagnosis: 'generated' })[3].status).toBe('Bloqueado');
  });
});

describe('Ajuste G: elementos de navegación solo si su pantalla existe', () => {
  it('Contacto no muestra «Encuesta» mientras no exista su pantalla', () => {
    expect(navItemsFor('contacto', { pendingDeliveries: 0 })).toEqual([]); // sin pantallas, sin menú vacío
    expect(navItemsFor('contacto', { pendingDeliveries: 0, summaryExists: true }).map((i) => i.label)).toEqual(['Resumen']);
    expect(navItemsFor('contacto', { pendingDeliveries: 0, summaryExists: true, surveyExists: true }).map((i) => i.label)).toEqual(['Resumen', 'Encuesta']);
  });
  it('Líder: Tablero y Entregas por revisar (n)', () => {
    expect(navItemsFor('lider', { pendingDeliveries: 2 }).map((i) => i.label)).toEqual(['Tablero', 'Entregas por revisar (2)']);
  });
});
