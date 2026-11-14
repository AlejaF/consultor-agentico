import type { Role } from '../app/router';
import { CRITERION_IDS } from '../data/rubric';
import { SURVEY_QUESTIONS } from '../data/survey';
import { canIssue, isValidEdit } from '../domain/review';
import { getDiagnosis, modeOf } from '../providers';
import { average, isGradingComplete } from '../domain/rubric';
import type { Decision, DiagnosisState, LocalFileMeta, Mode, PersistedState, ProjectState, RealState, ServerFileMeta } from './types';

export type Action =
  | { type: 'setRole'; role: Role | null }
  | { type: 'reset'; state: PersistedState }
  | { type: 'addFiles'; projectId: string; files: LocalFileMeta[] }
  | { type: 'removeFile'; projectId: string; fileId: string }
  | { type: 'setAnswer'; projectId: string; questionId: string; value: string }
  | { type: 'generate'; projectId: string; at: string }
  | { type: 'setMode'; projectId: string; mode: Mode }
  | { type: 'generateReal'; projectId: string; at: string; real: RealState }
  | { type: 'clearDiagnosis'; projectId: string }
  | { type: 'addServerFiles'; projectId: string; files: ServerFileMeta[] }
  | { type: 'removeServerFile'; projectId: string; fileId: string }
  | { type: 'setServerFiles'; projectId: string; files: ServerFileMeta[] }
  | { type: 'decide'; projectId: string; findingId: string; decision: 'accepted' | 'rejected' | 'pending' }
  | { type: 'edit'; projectId: string; findingId: string; text: string }
  | { type: 'issue'; projectId: string; at: string }
  | { type: 'generateStrategy'; projectId: string; at: string }
  | { type: 'sendStrategy'; projectId: string; at: string }
  | { type: 'submitSurvey'; projectId: string; answers: Record<string, number>; at: string }
  | { type: 'saveGrading'; deliveryId: string; levels: Record<string, number>; comment: string; at: string };

/** La entrega existe: `dx/<id>` con el diagnóstico emitido o `st/<id>` con la estrategia enviada (FR-022, FR-027). */
function deliveryExists(state: PersistedState, deliveryId: string): boolean {
  const m = deliveryId.match(/^(dx|st)\/(.+)$/);
  const p = m ? state.projects[m[2]] : undefined;
  if (!m || !p) return false;
  return m[1] === 'dx' ? p.diagnosis.status === 'issued' : p.strategy.status === 'sent';
}

function updateProject(state: PersistedState, projectId: string, fn: (p: ProjectState) => ProjectState): PersistedState {
  const current = state.projects[projectId];
  if (!current) return state;
  return { ...state, projects: { ...state.projects, [projectId]: fn(current) } };
}

/** Aplica un cambio al diagnóstico solo mientras está «generado»; emitido es de solo lectura. */
function updateOpenDiagnosis(state: PersistedState, projectId: string, fn: (d: DiagnosisState, ids: readonly string[]) => DiagnosisState | null): PersistedState {
  const p = state.projects[projectId];
  if (!p || p.diagnosis.status !== 'generated') return state;
  const next = fn(p.diagnosis, getDiagnosis(p).ids);
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
      if (modeOf(p) === 'real') return state; // en modo real el diagnóstico sale de `generateReal`, nunca de la plantilla (AG-029)
      const decisions: Record<string, Decision> = Object.fromEntries(getDiagnosis(p).ids.map((id) => [id, { state: 'pending' } as Decision]));
      return updateProject(state, action.projectId, (pp) => ({
        ...pp,
        diagnosis: { status: 'generated', generatedAt: action.at, decisions },
      }));
    }
    case 'setMode': {
      // El modo queda fijado cuando hay diagnóstico (AG-029); solo «Limpiar diagnóstico» lo libera.
      const p = state.projects[action.projectId];
      if (!p || p.diagnosis.status !== 'none' || modeOf(p) === action.mode) return state;
      return updateProject(state, action.projectId, (pp) => ({ ...pp, mode: action.mode }));
    }
    case 'generateReal': {
      const p = state.projects[action.projectId];
      if (!p || p.diagnosis.status !== 'none' || modeOf(p) !== 'real') return state; // idempotente
      const decisions: Record<string, Decision> = Object.fromEntries(action.real.findings.map((f) => [f.id, { state: 'pending' } as Decision]));
      return updateProject(state, action.projectId, (pp) => ({
        ...pp,
        mode: 'real',
        real: action.real,
        diagnosis: { status: 'generated', generatedAt: action.at, decisions },
      }));
    }
    case 'clearDiagnosis': {
      // Solo un diagnóstico «generado» y sin estrategia: lo emitido es de solo lectura y puede tener entrega o calificación (FR-021, FR-031).
      const p = state.projects[action.projectId];
      if (!p || p.diagnosis.status !== 'generated' || p.strategy.status !== 'none') return state;
      const { real: _real, ...rest } = p;
      return updateProject(state, action.projectId, () => ({ ...rest, diagnosis: { status: 'none', decisions: {} } }));
    }
    case 'addServerFiles':
      return updateProject(state, action.projectId, (p) => {
        const known = new Set((p.serverFiles ?? []).map((f) => f.id));
        return { ...p, serverFiles: [...(p.serverFiles ?? []), ...action.files.filter((f) => !known.has(f.id))] };
      });
    case 'removeServerFile':
      return updateProject(state, action.projectId, (p) => ({ ...p, serverFiles: (p.serverFiles ?? []).filter((f) => f.id !== action.fileId) }));
    case 'setServerFiles':
      return updateProject(state, action.projectId, (p) => ({ ...p, serverFiles: action.files }));
    case 'decide':
      return updateOpenDiagnosis(state, action.projectId, (d, ids) =>
        ids.includes(action.findingId)
          ? { ...d, decisions: { ...d.decisions, [action.findingId]: { state: action.decision } } }
          : null,
      );
    case 'edit':
      return updateOpenDiagnosis(state, action.projectId, (d, ids) =>
        ids.includes(action.findingId) && isValidEdit(action.text)
          ? { ...d, decisions: { ...d.decisions, [action.findingId]: { state: 'edited', text: action.text.trim() } } }
          : null,
      );
    case 'issue':
      return updateOpenDiagnosis(state, action.projectId, (d, ids) =>
        canIssue(ids, d.decisions) ? { ...d, status: 'issued', issuedAt: action.at } : null,
      );
    case 'generateStrategy': {
      const p = state.projects[action.projectId];
      if (!p || p.diagnosis.status !== 'issued' || p.strategy.status !== 'none') return state; // idempotente
      return updateProject(state, action.projectId, (pp) => ({ ...pp, strategy: { status: 'generated', generatedAt: action.at } }));
    }
    case 'sendStrategy': {
      const p = state.projects[action.projectId];
      if (!p || p.strategy.status !== 'generated') return state; // idempotente
      return updateProject(state, action.projectId, (pp) => ({ ...pp, strategy: { ...pp.strategy, status: 'sent', sentAt: action.at } }));
    }
    case 'submitSurvey': {
      // Las 3 preguntas obligatorias, con un nivel de 1 a 5; una encuesta guardada no se modifica (FR-036)
      if (!state.projects[action.projectId] || state.surveys[action.projectId]) return state;
      const ok = SURVEY_QUESTIONS.every((q) => Number.isInteger(action.answers[q.id]) && action.answers[q.id] >= 1 && action.answers[q.id] <= 5);
      if (!ok) return state;
      const answers = Object.fromEntries(SURVEY_QUESTIONS.map((q) => [q.id, action.answers[q.id]]));
      return { ...state, surveys: { ...state.surveys, [action.projectId]: { answers, submittedAt: action.at } } };
    }
    case 'saveGrading': {
      // Solo la entrega existente, sin calificar y con la calificación completa. No toca diagnóstico ni estrategia (FR-031).
      if (!deliveryExists(state, action.deliveryId) || action.deliveryId in state.gradings) return state;
      if (!isGradingComplete(action.levels)) return state;
      const levels = Object.fromEntries(CRITERION_IDS.map((id) => [id, action.levels[id] as 1 | 2 | 3 | 4 | 5]));
      return {
        ...state,
        gradings: {
          ...state.gradings,
          [action.deliveryId]: { levels, comment: action.comment.trim(), average: average(levels), gradedAt: action.at },
        },
      };
    }
    default:
      return state;
  }
}
