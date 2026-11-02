import { useSyncExternalStore } from 'react';

export type Role = 'consultor' | 'lider' | 'contacto';

export const ROLE_LABEL: Record<Role, string> = {
  consultor: 'Consultor',
  lider: 'Líder',
  contacto: 'Empresa',
};

export type RouteId =
  | 'login'
  | 'consultor.projects'
  | 'consultor.evidence'
  | 'consultor.diagnosis'
  | 'consultor.review'
  | 'consultor.strategy'
  | 'consultor.report'
  | 'lider.dashboard'
  | 'lider.deliveries'
  | 'lider.delivery'
  | 'lider.deliveryReport'
  | 'contacto.summary'
  | 'contacto.survey'
  | 'contacto.report';

export interface RouteDef {
  id: RouteId;
  pattern: string;
  /** null = cualquiera (solo el ingreso). */
  role: Role | null;
  title: string;
}

/** Tabla de rutas (contracts/routes.md). */
export const ROUTES: readonly RouteDef[] = [
  { id: 'login', pattern: '#/', role: null, title: 'Ingreso' },
  { id: 'consultor.projects', pattern: '#/consultor', role: 'consultor', title: 'Proyectos' },
  { id: 'consultor.evidence', pattern: '#/consultor/proyectos/:projectId/evidencia', role: 'consultor', title: 'Captura de evidencia' },
  { id: 'consultor.diagnosis', pattern: '#/consultor/proyectos/:projectId/diagnostico', role: 'consultor', title: 'Diagnóstico' },
  { id: 'consultor.review', pattern: '#/consultor/proyectos/:projectId/revision', role: 'consultor', title: 'Revisión y emisión' },
  { id: 'consultor.strategy', pattern: '#/consultor/proyectos/:projectId/estrategia', role: 'consultor', title: 'Estrategia' },
  { id: 'consultor.report', pattern: '#/consultor/proyectos/:projectId/informe', role: 'consultor', title: 'Informe de diagnóstico' },
  { id: 'lider.dashboard', pattern: '#/lider', role: 'lider', title: 'Tablero' },
  { id: 'lider.deliveries', pattern: '#/lider/entregas', role: 'lider', title: 'Entregas por revisar' },
  { id: 'lider.delivery', pattern: '#/lider/entregas/:tipo/:projectId', role: 'lider', title: 'Revisión de entrega' },
  { id: 'lider.deliveryReport', pattern: '#/lider/entregas/:tipo/:projectId/informe', role: 'lider', title: 'Informe de diagnóstico' },
  { id: 'contacto.summary', pattern: '#/contacto', role: 'contacto', title: 'Empresa' },
  { id: 'contacto.survey', pattern: '#/contacto/encuesta', role: 'contacto', title: 'Encuesta' },
  { id: 'contacto.report', pattern: '#/contacto/informe', role: 'contacto', title: 'Informe de diagnóstico' },
];

export interface RouteMatch {
  id: RouteId;
  role: Role | null;
  title: string;
  params: Record<string, string>;
}

export function homeOf(role: Role): string {
  return `#/${role}`;
}

function normalizeHash(hash: string): string {
  let h = hash.trim();
  if (h === '' || h === '#') return '#/';
  if (!h.startsWith('#/')) return h;
  if (h.length > 2 && h.endsWith('/')) h = h.slice(0, -1);
  return h;
}

export function matchRoute(hash: string): RouteMatch | null {
  const parts = normalizeHash(hash).split('/');
  for (const r of ROUTES) {
    const pat = r.pattern.split('/');
    if (pat.length !== parts.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    for (let i = 0; i < pat.length; i++) {
      if (pat[i].startsWith(':')) {
        if (parts[i] === '') {
          ok = false;
          break;
        }
        params[pat[i].slice(1)] = decodeURIComponent(parts[i]);
      } else if (pat[i] !== parts[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return { id: r.id, role: r.role, title: r.title, params };
  }
  return null;
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener('hashchange', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('hashchange', cb);
  };
}

/** Cambia de ruta y avisa de inmediato, para poder agrupar el cambio con otras actualizaciones de estado. */
export function navigate(hash: string): void {
  window.location.hash = hash;
  notify();
}

/** Redirige sin añadir una entrada al historial. */
export function replaceHash(hash: string): void {
  window.history.replaceState(null, '', hash);
  notify();
}

export function useHashRoute(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash);
}
