import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkAvailability } from '../../src/providers/availability';

afterEach(() => vi.unstubAllEnvs());

describe('disponibilidad bajo una subruta (sitio publicado)', () => {
  it('no hace ninguna petición y queda «no disponible»', async () => {
    vi.stubEnv('BASE_URL', '/mi-repo/');
    const f = vi.fn();
    expect(await checkAvailability(f as unknown as typeof fetch)).toEqual({ state: 'unavailable' });
    expect(f).not.toHaveBeenCalled();
  });
  it('en la raíz sí pregunta a /api/health', async () => {
    vi.stubEnv('BASE_URL', '/');
    const f = vi.fn().mockRejectedValue(new Error('sin servicio'));
    expect((await checkAvailability(f as unknown as typeof fetch)).state).toBe('unavailable');
    expect(f).toHaveBeenCalledTimes(1);
  });
});
