// ¿Hay servicio local? `GET /api/health`. En el sitio publicado no hay proxy ni servicio: queda «no disponible» (principio II).
import type { Availability, ServiceHealth } from './types';

export const UNAVAILABLE_TEXT = 'IA real no disponible aquí (requiere ejecutar el backend en tu equipo)';

export async function checkAvailability(fetchFn: typeof fetch = fetch, signal?: AbortSignal): Promise<Availability> {
  try {
    const r = await fetchFn('/api/health', { signal, headers: { accept: 'application/json' } });
    if (!r.ok) return { state: 'unavailable' };
    const type = r.headers.get('content-type') ?? '';
    if (!type.includes('json')) return { state: 'unavailable' }; // un servidor de archivos estáticos responde HTML, no el servicio
    const body = (await r.json()) as Partial<ServiceHealth>;
    if (body?.ok !== true || !body.models) return { state: 'unavailable' };
    return { state: 'available', health: body as ServiceHealth };
  } catch {
    return { state: 'unavailable' };
  }
}
