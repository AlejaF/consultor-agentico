import { FINDING_IDS } from '../data/diagnosis';
import { INITIAL_PROJECT_STATES, PROJECTS } from '../data/projects';
import { SCHEMA_VERSION, type Catalogs, type PersistedState } from './types';

export function createInitialState(): PersistedState {
  return {
    schemaVersion: SCHEMA_VERSION,
    session: { role: null },
    projects: structuredClone(INITIAL_PROJECT_STATES),
    gradings: {},
    surveys: {},
    activity: [],
  };
}

/** Catálogos para validar lo guardado. Los criterios (L4) se añaden en sus lotes. */
export const CATALOGS: Catalogs = {
  projectIds: PROJECTS.map((p) => p.id),
  findingIds: FINDING_IDS,
  criterionIds: [],
};
