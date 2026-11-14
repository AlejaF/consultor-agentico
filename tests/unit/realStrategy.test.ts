// Lote E · T099 (SC-A4, SC-012, FR-025): la estrategia real pasa por deriveStrategy sin cambios y se vuelve a filtrar al mostrarse.
import { describe, expect, it } from 'vitest';
import { deriveStrategy } from '../../src/domain/strategy';
import { realStrategyTemplate } from '../../src/domain/realStrategy';
import { getStrategy } from '../../src/providers';
import { STRATEGY } from '../../src/data/strategy';
import type { Decision, RealState } from '../../src/state/types';

const real = (): RealState => ({
  findings: [], missingInfo: [], objections: [],
  strategy: {
    risks: [{ id: 'ER1', label: 'Riesgo uno', detail: 'Detalle uno.', level: 'alto', supportedBy: ['R1'] }],
    route: [{ id: 'EF1', label: 'Fase uno', detail: 'Detalle fase.', horizon: '0-3 meses', supportedBy: ['R1', 'R2'] }, { id: 'EF2', label: 'Fase dos', detail: 'Otra.', horizon: '3-6 meses', supportedBy: ['R2'] }],
  },
});
const findings = [{ id: 'R1', verified: true }, { id: 'R2', verified: true }];
const dec = (m: Record<string, Decision['state']>): Record<string, Decision> => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v === 'edited' ? { state: 'edited', text: 'x' } : { state: v }])) as Record<string, Decision>;

describe('estrategia real con deriveStrategy', () => {
  it('pasa por deriveStrategy sin cambios: cada elemento deriva solo de lo aceptado/editado y verificado', () => {
    const d = deriveStrategy(realStrategyTemplate(real()), findings, dec({ R1: 'accepted', R2: 'edited' }));
    expect(d.risks.map((r) => r.derivedFrom)).toEqual([['R1']]);
    expect(d.route.map((r) => r.derivedFrom)).toEqual([['R1', 'R2'], ['R2']]);
    expect(d.empty).toBe(false);
  });
  it('si la persona rechaza un hallazgo después de generar, el elemento que dependía solo de él desaparece, sin llamar al modelo', () => {
    const d = deriveStrategy(realStrategyTemplate(real()), findings, dec({ R1: 'accepted', R2: 'rejected' }));
    expect(d.route.map((r) => r.id)).toEqual(['EF1']);
    expect(d.route[0]!.derivedFrom).toEqual(['R1']);
    const none = deriveStrategy(realStrategyTemplate(real()), findings, dec({ R1: 'rejected', R2: 'rejected' }));
    expect(none.empty).toBe(true);
  });
  it('un hallazgo NO VERIFICADO aceptado no respalda nada', () => {
    const d = deriveStrategy(realStrategyTemplate(real()), [{ id: 'R1', verified: false }, { id: 'R2', verified: true }], dec({ R1: 'accepted', R2: 'accepted' }));
    expect(d.risks).toEqual([]);
    expect(d.route.map((r) => r.id)).toEqual(['EF1', 'EF2']);
    expect(d.unverifiedAdopted).toBe(1);
  });
  it('sector y mercado quedan vacíos en modo real (no hay plantilla ilustrativa)', () => {
    const t = realStrategyTemplate(real());
    expect(t.sector.keyPoints).toEqual([]);
    expect(t.market.summary).toBe('');
    expect(deriveStrategy(t, findings, dec({ R1: 'accepted' })).sector.implication).toBeNull();
  });
  it('getStrategy: Simulado devuelve la plantilla de la 001 (misma referencia); real, la guardada; real sin estrategia, vacía', () => {
    expect(getStrategy({ mode: 'simulated' })).toEqual({ mode: 'simulated', template: STRATEGY });
    expect(getStrategy(undefined).template).toBe(STRATEGY);
    expect(getStrategy({ mode: 'real', real: real() }).template.risks.map((r) => r.id)).toEqual(['ER1']);
    expect(getStrategy({ mode: 'real' })).toMatchObject({ mode: 'real', template: { risks: [], route: [] } });
  });
});
