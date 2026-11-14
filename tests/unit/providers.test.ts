import { describe, expect, it, vi } from 'vitest';
import { DIAGNOSIS, FINDING_IDS } from '../../src/data/diagnosis';
import { getDiagnosis, modeOf } from '../../src/providers';
import { checkAvailability, UNAVAILABLE_TEXT } from '../../src/providers/availability';
import { createRealProvider } from '../../src/providers/real';
import type { ProjectState } from '../../src/state/types';

const json = (body: unknown, status = 200, type = 'application/json') => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': type } });
const base: ProjectState = { answers: {}, localFiles: [], diagnosis: { status: 'none', decisions: {} }, strategy: { status: 'none' } };

describe('getDiagnosis(proyecto)', () => {
  it('en modo Simulado (o sin modo) devuelve EXACTAMENTE la plantilla de la 001', () => {
    expect(getDiagnosis(base).findings).toBe(DIAGNOSIS.findings);
    expect(getDiagnosis({ ...base, mode: 'simulated' }).ids).toBe(FINDING_IDS);
    expect(getDiagnosis(undefined).findings).toBe(DIAGNOSIS.findings);
    expect(modeOf(base)).toBe('simulated');
  });
  it('en modo real devuelve los hallazgos reales, con sus citas y sin mezclar los de ejemplo', () => {
    const real = { findings: [{ id: 'R1', dimension: 'datos' as const, title: 't', text: 'x', verified: true, origin: 'agent' as const, citations: [{ file: 'a.txt', location: { kind: 'line' as const, n: 4 }, quote: 'q', verified: true }] }], missingInfo: [], objections: [] };
    const v = getDiagnosis({ ...base, mode: 'real', real });
    expect(v.mode).toBe('real');
    expect(v.ids).toEqual(['R1']);
    expect(v.findings[0]!.realCitations).toHaveLength(1);
    expect(v.findings[0]!.citations).toEqual([]);
  });
  it('en modo real sin resultado no devuelve hallazgos de ejemplo', () => {
    expect(getDiagnosis({ ...base, mode: 'real' }).findings).toEqual([]);
  });
});

describe('disponibilidad (GET /api/health)', () => {
  const health = { ok: true, version: '0.1.0', keyConfigured: true, models: { diagnosis: 'm', strategy: null, critic: null }, limits: {}, fake: true };
  it('responde el servicio → disponible', async () => {
    const f = vi.fn(async (_u: string) => json(health));
    expect((await checkAvailability(f as unknown as typeof fetch)).state).toBe('available');
    expect(f.mock.calls[0]![0]).toBe('/api/health');
  });
  it('sin servicio (red caída, 404 o una página HTML del sitio publicado) → no disponible', async () => {
    expect((await checkAvailability((async () => { throw new TypeError('x'); }) as unknown as typeof fetch)).state).toBe('unavailable');
    expect((await checkAvailability((async () => json({}, 404)) as unknown as typeof fetch)).state).toBe('unavailable');
    expect((await checkAvailability((async () => json('<html></html>', 200, 'text/html')) as unknown as typeof fetch)).state).toBe('unavailable');
  });
  it('el mensaje fijo es el del spec', () => {
    expect(UNAVAILABLE_TEXT).toBe('IA real no disponible aquí (requiere ejecutar el backend en tu equipo)');
  });
});

describe('proveedor real (fetch simulado)', () => {
  it('runDiagnosis envía proyecto y empresa al servicio', async () => {
    const f = vi.fn(async (_u: string, _i?: RequestInit) => json({ run: {}, findings: [], missingInfo: [], trace: [], warnings: [] }));
    const r = await createRealProvider(f as unknown as typeof fetch).runDiagnosis('P-A', 'Empresa Ficticia Alfa');
    expect(r.ok).toBe(true);
    expect(f.mock.calls[0]![0]).toBe('/api/diagnosis/run');
    expect(JSON.parse(String(f.mock.calls[0]![1]!.body))).toEqual({ projectId: 'P-A', empresa: 'Empresa Ficticia Alfa' });
  });
  it('los errores se deciden por error.category, no por el código HTTP', async () => {
    const mk = (status: number, category: string) => createRealProvider((async () => json({ error: { category, message: 'm', retryable: false } }, status)) as unknown as typeof fetch).runDiagnosis('P-A', 'x');
    for (const [status, category] of [[500, 'balance'], [401, 'invalid_request'], [502, 'invalid_request'], [404, 'model_unavailable']] as const) {
      const r = await mk(status, category);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.category).toBe(category);
    }
  });
  it('conserva el código del proveedor y la traza del error', async () => {
    const body = { error: { category: 'invalid_request', message: 'x', retryable: false, providerStatus: 400, providerCode: 'unsupported_value', trace: [{ type: 'model_error', category: 'invalid_request', message: 'x' }] } };
    const r = await createRealProvider((async () => json(body, 502)) as unknown as typeof fetch).runDiagnosis('P-A', 'x');
    expect(r.ok === false && r.error).toMatchObject({ providerStatus: 400, providerCode: 'unsupported_value' });
    expect(r.ok === false && r.error.trace).toHaveLength(1);
  });
  it('sin red → unreachable (reintentable a mano); cuerpo que no es JSON → internal', async () => {
    const down = await createRealProvider((async () => { throw new TypeError('fetch failed'); }) as unknown as typeof fetch).runDiagnosis('P-A', 'x');
    expect(down.ok === false && down.error).toMatchObject({ category: 'unreachable', retryable: true });
    const odd = await createRealProvider((async () => json('no es json', 500, 'text/plain')) as unknown as typeof fetch).runDiagnosis('P-A', 'x');
    expect(odd.ok === false && odd.error.category).toBe('internal');
  });
  it('uploadFiles manda multipart a /api/evidence con el proyecto; listFiles y removeFile usan las rutas del contrato', async () => {
    const f = vi.fn(async (_u: string, _i?: RequestInit) => json({ files: [], ok: true }));
    const p = createRealProvider(f as unknown as typeof fetch);
    await p.uploadFiles('P-A', [new File(['hola'], 'a.txt', { type: 'text/plain' })]);
    await p.listFiles('P-A');
    await p.removeFile('P-A', 'f1');
    expect(f.mock.calls[0]![0]).toBe('/api/evidence?projectId=P-A');
    expect(f.mock.calls[0]![1]!.body).toBeInstanceOf(FormData);
    expect(f.mock.calls[1]![0]).toBe('/api/evidence/P-A');
    expect(f.mock.calls[2]).toEqual(['/api/evidence/P-A/f1', { method: 'DELETE' }]);
  });
});
