// Capa de proveedor: dos implementaciones (Simulado = la de la 001; IA real = servicio local). AG-001, AG-003.
import type { Finding } from '../data/diagnosis';
import { STRATEGY, type StrategyTemplate } from '../data/strategy';
import { realStrategyTemplate } from '../domain/realStrategy';
import type { Mode, ProjectState, RealFinding } from '../state/types';
import { simulatedDiagnosis, type DiagnosisView } from './simulated';

export type { DiagnosisView };

/** Modo del proyecto; ausente equivale a «simulated» (contracts/persisted-state-v3.md). */
export function modeOf(ps: Pick<ProjectState, 'mode'> | undefined): Mode {
  return ps?.mode === 'real' ? 'real' : 'simulated';
}

/** Un hallazgo real, con la forma de `Finding` de la 001. */
export function toFinding(f: RealFinding): Finding {
  return {
    id: f.id,
    dimension: f.dimension,
    title: f.title,
    text: f.text,
    citations: [],
    realCitations: f.citations,
    verified: f.verified,
    ...(f.unverifiedReason !== undefined ? { unverifiedReason: f.unverifiedReason } : {}),
  };
}

/**
 * Los hallazgos del proyecto según su modo. Sin proyecto o en modo Simulado devuelve la plantilla de la 001, idéntica
 * (misma referencia); en modo real, los hallazgos guardados en `real` (AG-018, AG-029: nunca se mezclan).
 */
export function getDiagnosis(ps?: Pick<ProjectState, 'mode' | 'real'>): DiagnosisView {
  if (ps && modeOf(ps) === 'real') {
    const findings = (ps.real?.findings ?? []).map(toFinding);
    return { mode: 'real', findings, ids: findings.map((f) => f.id) };
  }
  return simulatedDiagnosis();
}

export interface StrategyViewData {
  mode: Mode;
  template: StrategyTemplate;
}

/**
 * La plantilla de estrategia del proyecto según su modo (AG-019, AG-029). Simulado = la plantilla de la 001 (misma referencia);
 * real = SOLO lo que generó el agente (vacío si aún no hay): un proyecto real nunca toma la estrategia ilustrativa.
 */
export function getStrategy(ps?: Pick<ProjectState, 'mode' | 'real'>): StrategyViewData {
  if (ps && modeOf(ps) === 'real') return { mode: 'real', template: realStrategyTemplate(ps.real) };
  return { mode: 'simulated', template: STRATEGY };
}
