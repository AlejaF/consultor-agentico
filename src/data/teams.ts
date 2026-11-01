export interface Team {
  id: string;
  name: string;
  projectIds: string[];
}

/** «Equipo 1» es el del Consultor de la demo; los otros tres aparecen solo en el tablero del Líder. */
export const TEAMS: readonly Team[] = [
  { id: 'T-0', name: 'Equipo 1', projectIds: ['P-A', 'P-B', 'P-C', 'P-D'] },
  { id: 'T-1', name: 'Equipo 2', projectIds: ['E-1'] },
  { id: 'T-2', name: 'Equipo 3', projectIds: ['E-2'] },
  { id: 'T-3', name: 'Equipo 4', projectIds: ['E-3'] },
];
