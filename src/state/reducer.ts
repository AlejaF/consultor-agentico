import type { Role } from '../app/router';
import { FINDING_IDS } from '../data/diagnosis';
import { canIssue, isValidEdit } from '../domain/review';
import type { Decision, DiagnosisState, LocalFileMeta, PersistedState, ProjectState } from './types';

export type Action =
  | { type: 'setRole'; role: Role | null }
  | { type: 'reset'; state: PersistedState }
  | { type: 'addFiles'; projectId: string; files: LocalFileMeta[] }
  | { type: 'removeFile'; projectId: string; fileId: string }
  | { type: 'setAnswer'; projectId: string; questionId: string; value: string }
  | { type: 'generate'; projectId: string; at: string }
  | { type: 'decide'; projectId: string; findingId: string; decision: 'accepted' | 'rejected' | 'pending' }
  | { type: 'edit'; projectId: string; findingId: string; text: string }
  | { type: 'issue'; projectId: string; at: string };

function updateProject(state: PersistedState, projectId: string, fn: (p: ProjectState) => ProjectState): PersistedState {
  const current = state.projects[projectId];
  if (!current) return state;
  return { ...state, projects: { ...state.projects, [projectId]: fn(current) } };
}

/** Aplica un cambio al diagnóstico solo mientras está «generado»; emitido es de solo lectura. */
function updateOpenDiagnosis(state: PersistedState, projectId: string, fn: (d: DiagnosisState) => DiagnosisState | null): PersistedState {
  const p = state.projects[projectId];
  if (!p || p.diagnosis.status !== 'generated') return state;
  const next = fn(p.diagnosis);
  if (next === null) return state;
  return updateProject(state, projectId, (pp) => ({ ...pp, diagnosis: next }));
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
    case 'generate': {
      const p = state.projects[action.projectId];
      if (!p || p.diagnosis.status !== 'none') return state; // idempotente
      const decisions: Record<string, Decision> = Object.fromEntries(FINDING_IDS.map((id) => [id, { state: 'pending' } as Decision]));
      return updateProject(state, action.projectId, (pp) => ({
        ...pp,
        diagnosis: { status: 'generated', generatedAt: action.at, decisions },
      }));
    }
    case 'decide':
      return updateOpenDiagnosis(state, action.projectId, (d) =>
        FINDING_IDS.includes(action.findingId)
          ? { ...d, decisions: { ...d.decisions, [action.findingId]: { state: action.decision } } }
          : null,
      );
    case 'edit':
      return updateOpenDiagnosis(state, action.projectId, (d) =>
        FINDING_IDS.includes(action.findingId) && isValidEdit(action.text)
          ? { ...d, decisions: { ...d.decisions, [action.findingId]: { state: 'edited', text: action.text.trim() } } }
          : null,
      );
    case 'issue':
      return updateOpenDiagnosis(state, action.projectId, (d) =>
        canIssue(FINDING_IDS, d.decisions) ? { ...d, status: 'issued', issuedAt: action.at } : null,
      );
  }
}
