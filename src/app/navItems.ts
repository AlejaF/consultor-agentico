import { homeOf, type Role, type RouteId } from './router';

export interface NavItem {
  label: string;
  href: string;
  routeId: RouteId;
}

interface Options {
  pendingDeliveries: number;
  summaryExists?: boolean;
  surveyExists?: boolean;
}

/** Elementos de navegación del rol, sin los pasos de un proyecto. Solo incluye pantallas que existen. */
export function navItemsFor(role: Role, { pendingDeliveries, summaryExists = false, surveyExists = false }: Options): NavItem[] {
  switch (role) {
    case 'consultor':
      return [{ label: 'Proyectos', href: homeOf('consultor'), routeId: 'consultor.projects' }];
    case 'lider':
      return [
        { label: 'Tablero', href: homeOf('lider'), routeId: 'lider.dashboard' },
        { label: `Entregas por revisar (${pendingDeliveries})`, href: '#/lider/entregas', routeId: 'lider.deliveries' },
      ];
    case 'contacto': {
      const items: NavItem[] = [];
      if (summaryExists) items.push({ label: 'Resumen', href: homeOf('contacto'), routeId: 'contacto.summary' });
      if (surveyExists) items.push({ label: 'Encuesta', href: '#/contacto/encuesta', routeId: 'contacto.survey' });
      return items;
    }
  }
}
