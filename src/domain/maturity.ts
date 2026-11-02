import { DIAGNOSIS } from '../data/diagnosis';
import { SEEDED_MATURITY } from '../data/projects';
import type { Team } from '../data/teams';
import type { PersistedState } from '../state/types';

/** Índice ilustrativo y ficticio de un proyecto: el sembrado, o el de la plantilla (FR-058). */
export function maturityOf(projectId: string): number {
  return SEEDED_MATURITY[projectId] ?? DIAGNOSIS.maturityIndex;
}

/** Índice de madurez de un proyecto: el de su diagnóstico emitido, o null si no está emitido (FR-057). */
export function projectMaturity(state: PersistedState, projectId: string): number | null {
  return state.projects[projectId]?.diagnosis.status === 'issued' ? maturityOf(projectId) : null;
}

function mean(values: (number | null)[]): number | null {
  const ok = values.filter((v): v is number => v !== null);
  return ok.length === 0 ? null : ok.reduce((a, b) => a + b, 0) / ok.length;
}

/** Madurez de un equipo: promedio de los diagnósticos emitidos de sus proyectos. */
export function teamMaturity(state: PersistedState, team: Pick<Team, 'projectIds'>): number | null {
  return mean(team.projectIds.map((id) => projectMaturity(state, id)));
}

/** Madurez promedio de todos los diagnósticos emitidos. */
export function averageMaturity(state: PersistedState): number | null {
  return mean(Object.keys(state.projects).map((id) => projectMaturity(state, id)));
}

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** El buscador coincide con el nombre del equipo o de cualquiera de sus empresas, sin mayúsculas ni tildes. */
export function teamMatches(query: string, teamName: string, companyNames: readonly string[]): boolean {
  const q = norm(query);
  if (q === '') return true;
  return [teamName, ...companyNames].some((n) => norm(n).includes(q));
}
