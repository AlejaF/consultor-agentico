import type { RealState, TraceSummary } from '../state/types';

export interface TechSheetRow {
  stage: TraceSummary['stage'];
  model: string;
  startedAt: string;
  finishedAt: string;
  tokens: TraceSummary['tokens'];
}

/**
 * Ficha técnica del informe (AG-023, AG-025): modelo, fecha y tokens de cada corrida, a partir del resumen guardado.
 * `null` si el proyecto es Simulado o no hay corrida. Nunca incluye texto de documentos ni de la traza.
 */
export function buildTechSheet(real: RealState | undefined): TechSheetRow[] | null {
  const run = real?.diagnosisRun;
  if (!run) return null;
  return [{ stage: run.stage, model: run.model, startedAt: run.startedAt, finishedAt: run.finishedAt, tokens: run.tokens }];
}
