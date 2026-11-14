// Lote D2 · T140 (AG-031 puntos 2, 4 y 8): la herramienta registrar_nivel_madurez y su verificador de respaldo.
import { describe, expect, it } from 'vitest';
import { createDiagnosisSession } from '../../server/src/agent/diagnosis.ts';
import { executeToolCall } from '../../server/src/agent/tools.ts';
import { createTrace } from '../../server/src/agent/trace.ts';
import type { Chunk } from '../../server/src/chunk.ts';

const P = (page: number, text: string): Chunk => ({ fileId: 'f1', location: { kind: 'page', page }, text });
const FILES = [
  {
    id: 'f1',
    name: 'politica.pdf',
    chunks: [
      P(3, 'Los indicadores se calculan a mano cada mes y no existe un responsable único de la calidad de los datos.'),
      P(5, 'La dirección aprobó un presupuesto anual para iniciativas de automatización de procesos internos.'),
    ],
  },
];
const Q3 = 'los indicadores se calculan a mano cada mes';
const Q5 = 'La dirección aprobó un presupuesto anual';

async function setup() {
  const trace = createTrace();
  const s = createDiagnosisSession(FILES, trace);
  const call = (name: string, args: unknown) => executeToolCall(s.tools, name, typeof args === 'string' ? args : JSON.stringify(args), trace);
  const hallazgo = (pilar: string, titulo: string, ubicacion: string, fragmento: string) =>
    call('registrar_hallazgo', { pilar, titulo, texto: 'Texto del hallazgo.', citas: [{ archivo: 'politica.pdf', ubicacion, fragmento }] });
  const nivel = (a: Record<string, unknown>) => call('registrar_nivel_madurez', { dimension: 'datos', nivel: 3, justificacion: 'Los indicadores son manuales.', derivaDe: ['R1'], ...a });
  // R1 (datos) y R2 (estrategia) verificados; R3 (cultura) NO VERIFICADO tras agotar los reintentos.
  await hallazgo('datos', 'Datos manuales', 'pág. 3', Q3);
  await hallazgo('estrategia', 'Presupuesto de automatización', 'pág. 5', Q5);
  const bad = 'esta frase no existe en ningún lugar del documento';
  for (let i = 0; i < 3; i++) await hallazgo('cultura', 'Cultura sin respaldo', 'pág. 3', bad);
  return { s, trace, call, nivel };
}

describe('registrar_nivel_madurez · validación de argumentos', () => {
  it.each([0, 6, 2.5, '3', -1])('rechaza el nivel %j', async (n) => {
    const { nivel, s } = await setup();
    const r = await nivel({ nivel: n });
    expect(r.ok).toBe(false);
    expect(s.maturity().find((m) => m.dimension === 'datos')).toMatchObject({ level: null, insufficient: true });
  });
  it('rechaza una justificación vacía o de más de 300 caracteres, y derivaDe vacío', async () => {
    const { nivel } = await setup();
    expect((await nivel({ justificacion: '   ' })).ok).toBe(false);
    expect((await nivel({ justificacion: 'x'.repeat(301) })).ok).toBe(false);
    expect((await nivel({ derivaDe: [] })).ok).toBe(false);
  });
  it('una dimensión fuera de la lista se devuelve al agente', async () => {
    const { nivel } = await setup();
    expect((await nivel({ dimension: 'finanzas' })).ok).toBe(false);
  });
  it('un argumento «indice» o «promedio» se rechaza como mal formado (AG-012) y queda en la traza', async () => {
    const { nivel, trace } = await setup();
    for (const extra of [{ indice: 3.2 }, { promedio: 3 }]) {
      const r = await nivel(extra);
      expect(r.ok).toBe(false);
    }
    expect(trace.steps.filter((x) => x.type === 'tool_error')).toHaveLength(2);
  });
  it('no existe ninguna herramienta que reciba un índice global (AG-031 punto 8)', async () => {
    const { s } = await setup();
    expect(s.tools.map((t) => t.name).sort()).toEqual(['buscar_en_evidencia', 'declarar_informacion_faltante', 'registrar_hallazgo', 'registrar_nivel_madurez']);
    const fields = s.tools.flatMap((t) => Object.keys((t.schema as unknown as { shape?: Record<string, unknown> }).shape ?? {}));
    expect(fields.join(' ')).not.toMatch(/indice|promedio|index/i);
  });
});

describe('registrar_nivel_madurez · verificador de respaldo', () => {
  it('acepta ids de hallazgos verificados del mismo pilar', async () => {
    const { nivel, s } = await setup();
    const r = await nivel({});
    expect(r.ok).toBe(true);
    expect(s.maturity().find((m) => m.dimension === 'datos')).toEqual({ dimension: 'datos', level: 3, insufficient: false, justification: 'Los indicadores son manuales.', derivesFrom: ['R1'] });
  });
  it('rechaza un id inexistente', async () => {
    const { nivel, s } = await setup();
    const r = await nivel({ derivaDe: ['R99'] });
    expect(r.ok).toBe(false);
    expect(String(r.output.error)).toContain('R99');
    expect(s.maturity().find((m) => m.dimension === 'datos')).toMatchObject({ level: null, insufficient: true });
  });
  it('rechaza un id de un hallazgo registrado pero NO verificado', async () => {
    const { nivel, s } = await setup();
    expect(s.findings().find((f) => f.id === 'R3')).toMatchObject({ verified: false, dimension: 'cultura' });
    const r = await nivel({ dimension: 'cultura', derivaDe: ['R3'] });
    expect(r.ok).toBe(false);
    expect(String(r.output.error)).toMatch(/verificad/i);
    expect(s.maturity().find((m) => m.dimension === 'cultura')).toMatchObject({ level: null, insufficient: true });
  });
  it('rechaza un hallazgo verificado de otro pilar (una dimensión sin hallazgos verificados propios no tiene nivel)', async () => {
    const { nivel } = await setup();
    const r = await nivel({ dimension: 'talento', derivaDe: ['R1'] });
    expect(r.ok).toBe(false);
  });
  it('si cita varios, todos deben ser válidos', async () => {
    const { nivel } = await setup();
    expect((await nivel({ derivaDe: ['R1', 'R3'] })).ok).toBe(false);
  });
  it('tras 2 reintentos fallidos la dimensión queda «sin evidencia suficiente» y los fallos quedan en la traza', async () => {
    const { nivel, s, trace } = await setup();
    const before = trace.steps.filter((x) => x.type === 'verification').length;
    expect((await nivel({ derivaDe: ['R99'] })).ok).toBe(false);
    expect((await nivel({ derivaDe: ['R99'] })).ok).toBe(false);
    const third = await nivel({ derivaDe: ['R99'] });
    expect(third.ok).toBe(false);
    expect(s.maturity().find((m) => m.dimension === 'datos')).toMatchObject({ level: null, insufficient: true, derivesFrom: [] });
    const steps = trace.steps.filter((x) => x.type === 'verification').slice(before);
    expect(steps).toHaveLength(3);
    expect(steps.every((x) => x.type === 'verification' && x.ok === false)).toBe(true);
    // una vez cerrada, ni siquiera una llamada válida la reabre
    expect((await nivel({})).ok).toBe(false);
    expect(s.maturity().find((m) => m.dimension === 'datos')).toMatchObject({ level: null, insufficient: true });
  });
  it('un nivel corregido tras un rechazo se registra y la traza dice «corregida»', async () => {
    const { nivel, s, trace } = await setup();
    expect((await nivel({ derivaDe: ['R99'] })).ok).toBe(false);
    expect((await nivel({})).ok).toBe(true);
    expect(s.maturity().find((m) => m.dimension === 'datos')).toMatchObject({ level: 3, insufficient: false });
    expect(trace.steps.filter((x) => x.type === 'verification').at(-1)).toMatchObject({ ok: true, resolution: 'corregida' });
  });
  it('una segunda llamada válida para la misma dimensión reemplaza la anterior; una inválida no la pisa', async () => {
    const { nivel, s } = await setup();
    await nivel({ nivel: 2 });
    await nivel({ nivel: 4 });
    expect(s.maturity().find((m) => m.dimension === 'datos')).toMatchObject({ level: 4 });
    await nivel({ nivel: 1, derivaDe: ['R99'] });
    expect(s.maturity().find((m) => m.dimension === 'datos')).toMatchObject({ level: 4 });
  });
});
