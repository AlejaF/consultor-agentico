import { describe, expect, it } from 'vitest';
import { estimarCosto, lineaDeCosto, SIN_TARIFA, TARIFAS, tarifaDe } from '../../scripts/lib/tarifas.mjs';

describe('tarifas por modelo (research.md §3)', () => {
  it('cada modelo usa SU tarifa', () => {
    expect(tarifaDe('gpt-6-luna')).toEqual({ input: 0.1, output: 0.5 });
    expect(tarifaDe('gpt-6.1-terra')).toEqual({ input: 1, output: 5 });
    expect(tarifaDe('gpt-6.1-sol')).toEqual({ input: 2, output: 10 });
    expect(tarifaDe('gpt-6-astra')).toEqual({ input: 10, output: 50 });
  });
  it('acepta una instantánea con fecha, pero no un prefijo parecido ni un modelo desconocido', () => {
    expect(tarifaDe('gpt-6.1-sol-2026-10-01')).toEqual(TARIFAS['gpt-6.1-sol']);
    expect(tarifaDe('gpt-6.1-sol-mini')).toBeNull();
    expect(tarifaDe('gpt-9')).toBeNull();
    expect(tarifaDe('constructor')).toBeNull();
    expect(tarifaDe(undefined)).toBeNull();
  });
  it('Sol con 16723 entrada y 1994 salida ≈ US$ 0.0534 (no el 0.0027 de la tarifa de Luna)', () => {
    const tokens = { input: 16723, output: 1994 };
    expect(estimarCosto('gpt-6.1-sol', tokens)).toBeCloseTo(0.053386, 6);
    expect(estimarCosto('gpt-6-luna', tokens)).toBeCloseTo(0.002669, 6);
    expect(lineaDeCosto('gpt-6.1-sol', tokens)).toContain('US$ 0.0534');
    expect(lineaDeCosto('gpt-6.1-sol', tokens)).toContain('entrada 2, salida 10');
  });
  it('modelo sin tarifa: dice «costo no estimado: modelo sin tarifa» y no muestra ninguna cifra', () => {
    const l = lineaDeCosto('modelo-nuevo', { input: 1000, output: 1000 });
    expect(l).toContain(SIN_TARIFA);
    expect(l).not.toMatch(/US\$/);
  });
  it('una tarifa fijada a mano por entorno (las dos variables) se respeta y se avisa; con una sola se ignora', () => {
    const t = { input: 16723, output: 1994 };
    expect(lineaDeCosto('modelo-nuevo', t, { RATE_INPUT_PER_M: '1', RATE_OUTPUT_PER_M: '2' })).toContain('indicada por ti');
    expect(lineaDeCosto('gpt-6.1-sol', t, { RATE_INPUT_PER_M: '1' })).toContain('US$ 0.0534');
  });
});
