import { useEffect, useState } from 'react';
import { checkAvailability } from './availability';
import type { Availability } from './types';

/** Comprueba `GET /api/health` al abrir la pantalla. Sin servicio (p. ej. el sitio publicado) queda «unavailable». */
export function useAvailability(): Availability {
  const [a, setA] = useState<Availability>({ state: 'checking' });
  useEffect(() => {
    const ctrl = new AbortController();
    void checkAvailability(fetch, ctrl.signal).then((r) => {
      if (!ctrl.signal.aborted) setA(r);
    });
    return () => ctrl.abort();
  }, []);
  return a;
}
