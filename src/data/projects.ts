import { CRITERION_IDS } from './rubric';
import { average } from '../domain/rubric';
import type { Decision, Grading, ProjectState } from '../state/types';
import { DIAGNOSIS } from './diagnosis';

import type { Slot } from './evidence';

export type { Slot };

export interface Project {
  id: string;
  teamId: string;
  companyId: string;
  ownedByDemoConsultor: boolean;
  lastActivityLabel: string;
  /** Ranuras de evidencia de ejemplo visibles en su lista; P-D: ninguna. */
  sampleSlots: Slot[];
  /** Ranuras de ejemplo con procesamiento pendiente (se muestran «Procesando»). */
  pendingSlots: Slot[];
}

export const PROJECTS: readonly Project[] = [
  { id: 'P-A', teamId: 'T-0', companyId: 'C-A', ownedByDemoConsultor: true, lastActivityLabel: 'Hace 2 días (ejemplo)', sampleSlots: [1, 2, 3, 4, 5], pendingSlots: [5] },
  { id: 'P-B', teamId: 'T-0', companyId: 'C-B', ownedByDemoConsultor: true, lastActivityLabel: 'Hace 1 semana (ejemplo)', sampleSlots: [1, 2, 3, 4], pendingSlots: [] },
  { id: 'P-C', teamId: 'T-0', companyId: 'C-C', ownedByDemoConsultor: true, lastActivityLabel: 'Hace 3 semanas (ejemplo)', sampleSlots: [1, 2, 3, 4, 5], pendingSlots: [] },
  { id: 'P-D', teamId: 'T-0', companyId: 'C-D', ownedByDemoConsultor: true, lastActivityLabel: 'Sin actividad (ejemplo)', sampleSlots: [], pendingSlots: [] },
  { id: 'E-1', teamId: 'T-1', companyId: 'C-E1', ownedByDemoConsultor: false, lastActivityLabel: 'Hace 4 días (ejemplo)', sampleSlots: [1, 2, 3, 4, 5], pendingSlots: [5] },
  { id: 'E-2', teamId: 'T-2', companyId: 'C-E2', ownedByDemoConsultor: false, lastActivityLabel: 'Hace 5 días (ejemplo)', sampleSlots: [1, 2, 3, 4], pendingSlots: [] },
  { id: 'E-3', teamId: 'T-3', companyId: 'C-E3', ownedByDemoConsultor: false, lastActivityLabel: 'Hace 1 día (ejemplo)', sampleSlots: [1, 2, 3, 4], pendingSlots: [] },
];

/**
 * Índice de madurez ILUSTRATIVO y FICTICIO, sembrado por proyecto (FR-058): no se calcula de los hallazgos ni de puntajes por pilar (no existen).
 * Los proyectos que no aparecen aquí (P-A, que se genera en la sesión, y E-1) conservan el de la plantilla de diagnóstico.
 */
export const SEEDED_MATURITY: Readonly<Record<string, number>> = { 'P-B': 2.4, 'P-C': 3.1, 'E-2': 1.8, 'E-3': 2.8 };

export function emptyProjectState(): ProjectState {
  return { answers: {}, localFiles: [], diagnosis: { status: 'none', decisions: {} }, strategy: { status: 'none' } };
}

const SEED_GENERATED_AT = '2026-10-19T14:00:00.000Z';
const SEED_ISSUED_AT = '2026-10-20T15:00:00.000Z';
const SEED_STRATEGY_AT = '2026-10-22T16:00:00.000Z';
const SEED_STRATEGY_SENT_AT = '2026-10-23T19:00:00.000Z';
const UNVERIFIED_ID = DIAGNOSIS.findings.find((f) => !f.verified)!.id;

function issuedState(overrides: Record<string, Decision> = {}): ProjectState {
  const decisions: Record<string, Decision> = Object.fromEntries(DIAGNOSIS.findings.map((f) => [f.id, { state: 'accepted' } as Decision]));
  return {
    ...emptyProjectState(),
    diagnosis: { status: 'issued', generatedAt: SEED_GENERATED_AT, issuedAt: SEED_ISSUED_AT, decisions: { ...decisions, ...overrides } },
  };
}

/**
 * Estado inicial de cada proyecto (datos ficticios).
 * - P-A: evidencia completa, diagnóstico sin generar. P-D: sin evidencia.
 * - P-B: diagnóstico emitido con un aceptado NO VERIFICADO, uno editado y uno rechazado (lo usa la prueba de estrategia de L4).
 * - P-C: diagnóstico emitido y estrategia enviada; equipos 2 a 4: diagnóstico emitido.
 */
export const INITIAL_PROJECT_STATES: Record<string, ProjectState> = {
  'P-A': emptyProjectState(),
  'P-B': issuedState({
    [UNVERIFIED_ID]: { state: 'accepted' },
    H2: { state: 'edited', text: 'La dirección quiere crecer, pero hoy no puede estimar el costo de atender a un cliente nuevo; conviene medirlo antes de decidir inversiones.' },
    H4: { state: 'rejected' },
  }),
  'P-C': { ...issuedState(), strategy: { status: 'sent', generatedAt: SEED_STRATEGY_AT, sentAt: SEED_STRATEGY_SENT_AT } },
  'P-D': emptyProjectState(),
  'E-1': issuedState({ H8: { state: 'rejected' } }),
  'E-2': issuedState(),
  'E-3': issuedState(),
};

export const CONSULTOR_PROJECT_IDS: readonly string[] = PROJECTS.filter((p) => p.ownedByDemoConsultor).map((p) => p.id);

function seedGrading(levels: number[], comment: string, gradedAt: string): Grading {
  const map = Object.fromEntries(CRITERION_IDS.map((id, i) => [id, levels[i] as 1 | 2 | 3 | 4 | 5]));
  return { levels: map, comment, average: average(map), gradedAt };
}

/** Calificaciones sembradas (ficticias): dx/P-C, st/P-C y el diagnóstico de un equipo adicional; los otros dos quedan por revisar. */
export const INITIAL_GRADINGS: Record<string, Grading> = {
  'dx/P-C': seedGrading([5, 4, 4, 5], 'Hallazgos bien citados. Conviene explicar mejor por qué se excluyó uno de ellos.', '2026-10-24T15:00:00.000Z'),
  'st/P-C': seedGrading([4, 4, 5, 4], 'La ruta sigue el diagnóstico. Falta detallar quién responde por cada fase.', '2026-10-27T16:30:00.000Z'),
  'dx/E-1': seedGrading([4, 3, 4, 4], 'Buen orden. El análisis se queda corto en la parte de datos.', '2026-10-25T14:30:00.000Z'),
};
