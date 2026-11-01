import { describe, expect, it } from 'vitest';
import { canIssue, isValidEdit, issueBlockReason, reviewProgress } from '../../src/domain/review';
import type { Decision } from '../../src/state/types';

const ids = ['H1', 'H2', 'H3', 'H4'];
const dec = (o: Record<string, Decision>) => o;
const A: Decision = { state: 'accepted' };
const R: Decision = { state: 'rejected' };
const E: Decision = { state: 'edited', text: 'texto' };
const P: Decision = { state: 'pending' };

describe('reviewProgress', () => {
  it('cuenta los hallazgos con decisión distinta de pendiente; los ausentes son pendientes', () => {
    expect(reviewProgress(ids, dec({ H1: A, H2: P, H3: R }))).toEqual({ reviewed: 2, total: 4 });
    expect(reviewProgress(ids, {})).toEqual({ reviewed: 0, total: 4 });
  });
});

describe('canIssue', () => {
  it('exige todos revisados y al menos uno aceptado o editado', () => {
    expect(canIssue(ids, dec({ H1: A, H2: A, H3: R, H4: E }))).toBe(true);
    expect(canIssue(ids, dec({ H1: A, H2: A, H3: R }))).toBe(false); // falta H4
    expect(canIssue(ids, dec({ H1: A, H2: P, H3: A, H4: A }))).toBe(false);
  });
  it('solo rechazados no se puede emitir', () => {
    expect(canIssue(ids, dec({ H1: R, H2: R, H3: R, H4: R }))).toBe(false);
  });
  it('un editado cuenta como aceptado', () => {
    expect(canIssue(ids, dec({ H1: E, H2: R, H3: R, H4: R }))).toBe(true);
  });
});

describe('issueBlockReason', () => {
  it('sin bloqueo devuelve null', () => {
    expect(issueBlockReason(ids, dec({ H1: A, H2: A, H3: A, H4: A }))).toBeNull();
  });
  it('con pendientes indica cuántos faltan, con concordancia', () => {
    expect(issueBlockReason(ids, dec({ H1: A, H2: A, H3: A }))).toBe('Falta 1 hallazgo por revisar.');
    expect(issueBlockReason(ids, dec({ H1: A }))).toBe('Faltan 3 hallazgos por revisar.');
  });
  it('con todo rechazado pide al menos uno aceptado o editado', () => {
    expect(issueBlockReason(ids, dec({ H1: R, H2: R, H3: R, H4: R }))).toBe('Debe haber al menos un hallazgo aceptado o editado.');
  });
});

describe('isValidEdit', () => {
  it('exige texto con contenido', () => {
    expect(isValidEdit('Texto nuevo')).toBe(true);
    expect(isValidEdit('')).toBe(false);
    expect(isValidEdit('   \n ')).toBe(false);
  });
});
