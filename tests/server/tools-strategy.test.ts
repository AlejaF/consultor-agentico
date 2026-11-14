// Lote E · T097 (AG-019, AG-020): la herramienta registrar_elemento y su verificador de respaldo. El verificador es CÓDIGO, no el modelo.
import { describe, expect, it } from 'vitest';
import { createStrategySession, type StrategyInputFinding } from '../../server/src/agent/strategy.ts';
import { executeToolCall } from '../../server/src/agent/tools.ts';
import { createTrace } from '../../server/src/agent/trace.ts';

const input: StrategyInputFinding[] = [
  { id: 'R1', dimension: 'datos', title: 'Datos manuales', text: 'Los indicadores se calculan a mano.', state: 'accepted', quotes: [] },
  { id: 'R2', dimension: 'gobernanza', title: 'Sin responsable', text: 'No hay responsable único.', state: 'edited', quotes: [] },
];
function setup() {
  const trace = createTrace();
  const s = createStrategySession(input, trace);
  const call = (args: unknown) => executeToolCall(s.tools, 'registrar_elemento', JSON.stringify(args), trace);
  return { s, call, trace };
}
const riesgo = (derivaDe: string[], extra: Record<string, unknown> = {}) => ({ tipo: 'riesgo', titulo: 'Decisiones sin dato', texto: 'Sin el dato se decide a ciegas.', nivel: 'alto', derivaDe, ...extra });
const fase = (derivaDe: string[], extra: Record<string, unknown> = {}) => ({ tipo: 'fase', titulo: 'Un responsable', texto: 'Nombrar un responsable de indicadores.', horizonte: '0-3 meses', derivaDe, ...extra });

describe('registrar_elemento', () => {
  it('registra un riesgo con nivel y una fase con horizonte, cada uno con su supportedBy', async () => {
    const { s, call } = setup();
    expect((await call(riesgo(['R1']))).ok).toBe(true);
    expect((await call(fase(['R1', 'R2']))).ok).toBe(true);
    expect(s.risks()).toEqual([{ id: 'ER1', label: 'Decisiones sin dato', detail: 'Sin el dato se decide a ciegas.', level: 'alto', supportedBy: ['R1'] }]);
    expect(s.route()).toEqual([{ id: 'EF1', label: 'Un responsable', detail: 'Nombrar un responsable de indicadores.', horizon: '0-3 meses', supportedBy: ['R1', 'R2'] }]);
  });
  it('un riesgo exige nivel y una fase exige horizonte', async () => {
    const { s, call } = setup();
    expect((await call(riesgo(['R1'], { nivel: undefined }))).ok).toBe(false);
    expect((await call(fase(['R1'], { horizonte: undefined }))).ok).toBe(false);
    expect((await call(riesgo(['R1'], { nivel: 'enorme' }))).ok).toBe(false);
    expect(s.risks()).toHaveLength(0);
    expect(s.route()).toHaveLength(0);
  });
  it('derivaDe vacío → error y no se registra', async () => {
    const { s, call } = setup();
    const r = await call(riesgo([]));
    expect(r.ok).toBe(false);
    expect(s.risks()).toHaveLength(0);
  });
  it('un id que no existe en la entrada (inexistente, rechazado, pendiente o NO VERIFICADO: el cliente no los envía) → error al agente', async () => {
    const { s, call } = setup();
    const r = await call(riesgo(['R9']));
    expect(r.ok).toBe(false);
    expect(JSON.stringify(r.output)).toContain('R9');
    expect(JSON.stringify(r.output)).toContain('R1');
    expect(s.risks()).toHaveLength(0);
  });
  it('tras agotar los reintentos con ids inválidos el elemento se DESCARTA y queda en la traza', async () => {
    const { s, call, trace } = setup();
    for (let i = 0; i < 3; i++) await call(riesgo(['R9']));
    expect(s.risks()).toHaveLength(0);
    expect(trace.steps.some((x) => x.type === 'verification' && !x.ok && x.resolution === 'descartada')).toBe(true);
  });
  it('un elemento mixto (un id válido y otro inventado) solo se conserva con el válido, tras agotar los reintentos', async () => {
    const { s, call } = setup();
    for (let i = 0; i < 3; i++) await call(riesgo(['R1', 'R9']));
    expect(s.risks().map((r) => r.supportedBy)).toEqual([['R1']]);
  });
  it('el mismo elemento corregido en un reintento se registra con sus ids válidos', async () => {
    const { s, call } = setup();
    expect((await call(riesgo(['R9']))).ok).toBe(false);
    expect((await call(riesgo(['R2']))).ok).toBe(true);
    expect(s.risks().map((r) => r.supportedBy)).toEqual([['R2']]);
  });
  it('no acepta campos extra como un índice o un estado de verificación puesto por el modelo', async () => {
    const { s, call } = setup();
    const r = await call(riesgo(['R1'], { verified: true, indice: 4 }));
    expect(r.ok).toBe(false);
    expect(s.risks()).toHaveLength(0);
  });
});
