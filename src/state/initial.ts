import { FINDING_IDS } from '../data/diagnosis';
import { INITIAL_GRADINGS, INITIAL_PROJECT_STATES, PROJECTS } from '../data/projects';
import { CRITERION_IDS } from '../data/rubric';
import { SCHEMA_VERSION, type Catalogs, type PersistedState } from './types';

export function createInitialState(): PersistedState {
  return {
    schemaVersion: SCHEMA_VERSION,
    session: { role: null },
    projects: structuredClone(INITIAL_PROJECT_STATES),
    gradings: structuredClone(INITIAL_GRADINGS),
    surveys: {},
    activity: [],
  };
}

/** Catálogos para validar lo guardado.  */
export const CATALOGS: Catalogs = {
  projectIds: PROJECTS.map((p) => p.id),
  findingIds: FINDING_IDS,
  criterionIds: CRITERION_IDS,
};
