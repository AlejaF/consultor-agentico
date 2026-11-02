import { UNBUILT_ROUTES } from '../../../src/app/features';
import { matchRoute, ROUTES, type Role, type RouteId } from '../../../src/app/router';

/** Una dirección concreta por pantalla existente, con el estado inicial sembrado que la muestra con contenido. */
export const SAMPLE_HASHES: Record<Role, { hash: string; name: string }[]> = {
  consultor: [
    { hash: '#/consultor/proyectos/P-B/evidencia', name: 'consultor-evidencia' },
    { hash: '#/consultor/proyectos/P-B/diagnostico', name: 'consultor-diagnostico' },
    { hash: '#/consultor/proyectos/P-B/revision', name: 'consultor-revision' },
    { hash: '#/consultor/proyectos/P-C/estrategia', name: 'consultor-estrategia' },
    { hash: '#/consultor', name: 'consultor-proyectos' },
  ],
  lider: [
    { hash: '#/lider/entregas', name: 'lider-entregas' },
    { hash: '#/lider/entregas/dx/E-2', name: 'lider-entrega-diagnostico' },
    { hash: '#/lider/entregas/st/P-C', name: 'lider-entrega-estrategia' },
    { hash: '#/lider', name: 'lider-tablero' },
  ],
  contacto: [{ hash: '#/contacto', name: 'contacto-vista' }],
};

export const BUILT_ROUTE_IDS: RouteId[] = ROUTES.map((r) => r.id).filter((id) => id !== 'login' && !(UNBUILT_ROUTES as readonly string[]).includes(id));

/** Ids de ruta cubiertos por las direcciones de muestra: debe coincidir con las rutas existentes de la tabla. */
export function coveredRouteIds(): Set<RouteId> {
  const ids = new Set<RouteId>();
  for (const list of Object.values(SAMPLE_HASHES)) for (const { hash } of list) ids.add(matchRoute(hash)!.id);
  return ids;
}

export const ROLE_BUTTON: Record<Role, string> = { consultor: 'Consultor', lider: 'Líder', contacto: 'Contacto' };
