import { PROJECTS } from '../data/projects';
import type { PersistedState } from '../state/types';

export interface Delivery {
  id: string;
  tipo: 'dx' | 'st';
  projectId: string;
  graded: boolean;
}

/** Entregas derivadas del estado: dx con el diagnóstico emitido, st con la estrategia enviada (FR-022). */
export function deliveriesFor(state: PersistedState): Delivery[] {
  const out: Delivery[] = [];
  for (const p of PROJECTS) {
    const ps = state.projects[p.id];
    if (!ps) continue;
    if (ps.diagnosis.status === 'issued') out.push({ id: `dx/${p.id}`, tipo: 'dx', projectId: p.id, graded: `dx/${p.id}` in state.gradings });
    if (ps.strategy.status === 'sent') out.push({ id: `st/${p.id}`, tipo: 'st', projectId: p.id, graded: `st/${p.id}` in state.gradings });
  }
  return out;
}
