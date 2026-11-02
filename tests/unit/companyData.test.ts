import { describe, expect, it } from 'vitest';
import { COMPANIES } from '../../src/data/companies';

describe('datos de la empresa (ficticios, FR-056)', () => {
  it('cada empresa tiene ciudad y sitio web inventados (dominio reservado .example)', () => {
    for (const c of COMPANIES) {
      expect(c.city.length).toBeGreaterThan(0);
      expect(c.website).toMatch(/\.example$/);
    }
  });
});
