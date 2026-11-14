// Lote D3 · T160 (AG-009, AG-023): qué roles ven la traza del agente y la ficha técnica.
import { describe, expect, it } from 'vitest';
import { canSeeTechSheet, canSeeTrace } from '../../src/domain/visibility';

describe('visibilidad por rol de lo técnico', () => {
  it('Consultor y Líder ven la traza y la ficha técnica', () => {
    for (const r of ['consultor', 'lider'] as const) {
      expect(canSeeTrace(r)).toBe(true);
      expect(canSeeTechSheet(r)).toBe(true);
    }
  });
  it('la Empresa (contacto) y quien no tiene rol no ven ninguna', () => {
    for (const r of ['contacto', null] as const) {
      expect(canSeeTrace(r)).toBe(false);
      expect(canSeeTechSheet(r)).toBe(false);
    }
  });
});
