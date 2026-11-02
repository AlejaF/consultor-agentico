import { DIAGNOSIS, type Finding } from '../data/diagnosis';
import { STRATEGY } from '../data/strategy';
import type { DiagnosisState, StrategyState } from '../state/types';
import { deriveStrategy, type DerivedStrategy } from './strategy';

/** consultor: proyecto propio · dx: entrega de diagnóstico · st: entrega de estrategia (FR-044). */
export type ReportScope = 'consultor' | 'dx' | 'st';

export interface ReportFinding {
  finding: Finding;
  /** Texto del Consultor si editó el hallazgo. */
  editedText?: string;
}

export type ReportStrategy =
  | { kind: 'derived'; derived: DerivedStrategy }
  | { kind: 'unavailable'; note: 'Estrategia aún no disponible' }
  | { kind: 'omitted' };

export type ReportContent =
  | { available: false; reason: string }
  | {
      available: true;
      scope: ReportScope;
      issuedAt?: string;
      maturityIndex: number;
      findings: ReportFinding[];
      /** Hallazgos rechazados: se cuentan, no se muestran (FR-046). */
      excluded: number;
      unverifiedShown: number;
      strategy: ReportStrategy;
    };

/**
 * Contenido del informe imprimible (FR-044 a FR-046). No recibe calificaciones ni comentarios del Líder, así que no puede incluirlos.
 * Una entrega nunca incluye una estrategia generada pero no enviada.
 */
export function reportContent(diagnosis: DiagnosisState, strategy: StrategyState, scope: ReportScope, maturityIndex: number = DIAGNOSIS.maturityIndex): ReportContent {
  if (diagnosis.status !== 'issued') {
    return { available: false, reason: 'El informe se genera a partir de un diagnóstico emitido. Emite primero el diagnóstico de este proyecto.' };
  }
  if (scope === 'st' && strategy.status !== 'sent') {
    return { available: false, reason: 'Esta entrega no tiene una estrategia enviada, así que no hay informe de estrategia.' };
  }
  const state = (id: string) => diagnosis.decisions[id];
  const findings: ReportFinding[] = DIAGNOSIS.findings
    .filter((f) => ['accepted', 'edited'].includes(state(f.id)?.state ?? 'pending'))
    .map((f) => {
      const d = state(f.id);
      return d?.state === 'edited' ? { finding: f, editedText: d.text } : { finding: f };
    });
  const excluded = DIAGNOSIS.findings.filter((f) => state(f.id)?.state === 'rejected').length;

  let strat: ReportStrategy;
  if (scope === 'dx') strat = { kind: 'omitted' };
  else if (scope === 'st' || strategy.status !== 'none') strat = { kind: 'derived', derived: deriveStrategy(STRATEGY, DIAGNOSIS.findings, diagnosis.decisions) };
  else strat = { kind: 'unavailable', note: 'Estrategia aún no disponible' };

  return {
    available: true,
    scope,
    issuedAt: diagnosis.issuedAt,
    maturityIndex,
    findings,
    excluded,
    unverifiedShown: findings.filter((f) => !f.finding.verified).length,
    strategy: strat,
  };
}
