import { useEffect } from 'react';

/**
 * Lleva la vista y el foco al encabezado `destino` (id) después del foco automático en el h1 (AppShell). La tarjeta o sección que lo
 * contiene queda arriba de la ventana y con un resalte persistente (contorno de 2 px, atributo `data-destino`) hasta que se cambie de
 * ruta. Se repite a los 250 ms por si el contenido cambió de alto (AG-036, H5).
 */
export function useDestino(destino: string | null, ...deps: unknown[]) {
  useEffect(() => {
    if (!destino) return;
    const contenedor = () => document.getElementById(destino)?.closest<HTMLElement>('article, li, section') ?? document.getElementById(destino);
    const alinear = () => {
      const el = document.getElementById(destino);
      const caja = contenedor();
      if (!el || !caja) return;
      caja.setAttribute('data-destino', 'true');
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
      caja.scrollIntoView({ block: 'start' });
    };
    const t = window.setTimeout(alinear, 0);
    const t2 = window.setTimeout(() => contenedor()?.scrollIntoView({ block: 'start' }), 250);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      contenedor()?.removeAttribute('data-destino');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destino, ...deps]);
}
