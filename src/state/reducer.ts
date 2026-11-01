import type { Role } from '../app/router';
import type { LocalFileMeta, PersistedState, ProjectState } from './types';

export type Action =
  | { type: 'setRole'; role: Role | null }
  | { type: 'reset'; state: PersistedState }
  | { type: 'addFiles'; projectId: string; files: LocalFileMeta[] }
  | { type: 'removeFile'; projectId: string; fileId: string }
  | { type: 'setAnswer'; projectId: string; questionId: string; value: string };

function updateProject(state: PersistedState, projectId: string, fn: (p: ProjectState) => ProjectState): PersistedState {
  const current = state.projects[projectId];
  if (!current) return state;
  return { ...state, projects: { ...state.projects, [projectId]: fn(current) } };
}

export function reducer(state: PersistedState, action: Action): PersistedState {
  switch (action.type) {
    case 'setRole':
      return { ...state, session: { ...state.session, role: action.role } };
    case 'reset':
      return action.state;
    case 'addFiles':
      // Solo nombre, tipo y tamaño (FR-006, FR-012): el contenido nunca entra al estado.
      // El diagnóstico y la estrategia no se tocan: la evidencia nueva no cambia lo emitido (FR-013).
      return updateProject(state, action.projectId, (p) => ({
        ...p,
        localFiles: [
          ...p.localFiles,
          ...action.files.map(({ id, name, type, size, addedAt }) => ({ id, name, type, size, addedAt })),
        ],
      }));
    case 'removeFile':
      return updateProject(state, action.projectId, (p) => ({
        ...p,
        localFiles: p.localFiles.filter((f) => f.id !== action.fileId),
      }));
    case 'setAnswer':
      return updateProject(state, action.projectId, (p) => ({
        ...p,
        answers: { ...p.answers, [action.questionId]: action.value },
      }));
  }
}
