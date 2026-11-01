export interface Team {
  id: string;
  name: string;
  projectIds: string[];
}

/** 'T-0' es el equipo del Consultor de la demo; los otros tres aparecen solo en el tablero del Líder. */
export const TEAMS: readonly Team[] = [
  { id: 'T-0', name: 'Equipo Demo Alfa', projectIds: ['P-A', 'P-B', 'P-C', 'P-D'] },
  { id: 'T-1', name: 'Equipo Demo Beta', projectIds: ['E-1'] },
  { id: 'T-2', name: 'Equipo Demo Gamma', projectIds: ['E-2'] },
  { id: 'T-3', name: 'Equipo Demo Delta', projectIds: ['E-3'] },
];
