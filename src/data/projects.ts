import type { ProjectState } from '../state/types';

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

export function emptyProjectState(): ProjectState {
  return { answers: {}, localFiles: [], diagnosis: { status: 'none', decisions: {} }, strategy: { status: 'none' } };
}

/**
 * Estado inicial de cada proyecto. En L1 todos parten vacíos; los estados sembrados
 * (P-B emitido, P-C enviado y calificado, equipos del Líder) se completan en L3 y L4.
 */
export const INITIAL_PROJECT_STATES: Record<string, ProjectState> = Object.fromEntries(
  PROJECTS.map((p) => [p.id, emptyProjectState()]),
);

export const CONSULTOR_PROJECT_IDS: readonly string[] = PROJECTS.filter((p) => p.ownedByDemoConsultor).map((p) => p.id);
