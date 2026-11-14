// Lote D2 · T145A (AG-031 punto 12): la nota del tablero del Líder solo cuando el promedio mezcla simulados y reales.
import { describe, expect, it } from 'vitest';
import { MIX_NOTE, averageMixesModes } from '../../src/domain/maturity';
import { createInitialState } from '../../src/state/initial';
import type { PersistedState, ProjectState, RealFinding, RealMaturityLevel } from '../../src/state/types';

const F: RealFinding = { id: 'R1', dimension: 'datos', title: 't', text: 't', verified: true, citations: [], origin: 'agent' };
const L: RealMaturityLevel = { dimension: 'datos', level: 3, insufficient: false, justification: 'j', derivesFrom: ['R1'] };
const real = (accepted: boolean, status: 'issued' | 'generated' = 'issued'): ProjectState => ({
  answers: {}, localFiles: [], strategy: { status: 'none' }, mode: 'real',
  diagnosis: { status, decisions: accepted ? { R1: { state: 'accepted' } } : {} },
  real: { findings: [F], missingInfo: [], objections: [], maturity: [L] },
});
const withReal = (p: ProjectState): PersistedState => {
  const s = createInitialState();
  s.projects['P-A'] = p;
  return s;
};

describe('averageMixesModes', () => {
  it('la nota es el texto acordado', () => {
    expect(MIX_NOTE).toBe('El promedio mezcla proyectos simulados (ilustrativos) y reales (estimados por IA)');
  });
  it('falso con los datos de ejemplo de la 001 (solo simulados)', () => {
    expect(averageMixesModes(createInitialState())).toBe(false);
  });
  it('verdadero con al menos un simulado emitido y un real emitido con índice', () => {
    expect(averageMixesModes(withReal(real(true)))).toBe(true);
  });
  it('falso si el real tiene índice «—» (no entra al promedio)', () => {
    expect(averageMixesModes(withReal(real(false)))).toBe(false);
  });
  it('falso si el real no está emitido', () => {
    expect(averageMixesModes(withReal(real(true, 'generated')))).toBe(false);
  });
  it('falso con solo reales (sin ningún simulado emitido)', () => {
    const s = withReal(real(true));
    for (const id of Object.keys(s.projects)) if (id !== 'P-A') s.projects[id]!.diagnosis = { status: 'none', decisions: {} };
    expect(averageMixesModes(s)).toBe(false);
  });
});
