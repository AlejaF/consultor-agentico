import { homeOf, matchRoute, ROLE_LABEL, type Role, type RouteMatch } from './router';

export interface AccessContext {
  /** Proyectos que el Consultor de la demo puede abrir. */
  consultorProjectIds: readonly string[];
  /** Una entrega existe solo si el diagnóstico está emitido (dx) o la estrategia enviada (st). */
  deliveryExists: (tipo: 'dx' | 'st', projectId: string) => boolean;
}

export type AccessResult =
  | { kind: 'allow'; route: RouteMatch }
  | { kind: 'redirect'; to: string; notice?: string };

export const NOT_FOUND_NOTICE = 'No encontramos esa pantalla.';

/** Regla de redirección única (contracts/routes.md). Función pura. */
export function accessDecision(hash: string, role: Role | null, ctx: AccessContext): AccessResult {
  const route = matchRoute(hash);

  // 1 y 2: ingreso
  if (route?.id === 'login') {
    return role ? { kind: 'redirect', to: homeOf(role) } : { kind: 'allow', route };
  }
  if (!role) return { kind: 'redirect', to: '#/' };

  // 4 (ruta desconocida)
  if (!route) return { kind: 'redirect', to: homeOf(role), notice: NOT_FOUND_NOTICE };

  // 3: ruta de otro rol
  if (route.role !== role) {
    return {
      kind: 'redirect',
      to: homeOf(role),
      notice: `Esa vista pertenece al rol ${ROLE_LABEL[route.role as Role]}. Estás como ${ROLE_LABEL[role]}.`,
    };
  }

  // 4: parámetros que no existen
  const { projectId, tipo } = route.params;
  let valid = true;
  if (role === 'consultor' && projectId !== undefined) {
    valid = ctx.consultorProjectIds.includes(projectId);
  }
  if (role === 'lider' && tipo !== undefined) {
    valid = (tipo === 'dx' || tipo === 'st') && ctx.deliveryExists(tipo, projectId);
  }
  if (!valid) return { kind: 'redirect', to: homeOf(role), notice: NOT_FOUND_NOTICE };

  // 5
  return { kind: 'allow', route };
}
