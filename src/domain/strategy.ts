import type { AnalysisTemplate, StrategyItem, StrategyTemplate } from '../data/strategy';
import type { Decision } from '../state/types';
import { countUnverifiedAdopted, usesAsSupport } from './review';

export interface DerivedItem extends StrategyItem {
  derivedFrom: string[];
}

export interface DerivedAnalysis {
  summary: string;
  keyPoints: readonly string[];
  sources: string;
  /** null si ningún hallazgo aceptado o editado y verificado la respalda (FR-026). */
  implication: { text: string; derivedFrom: string[] } | null;
}

export interface DerivedStrategy {
  sector: DerivedAnalysis;
  market: DerivedAnalysis;
  risks: DerivedItem[];
  route: DerivedItem[];
  /** Ningún elemento tiene respaldo. */
  empty: boolean;
  /** Hallazgos NO VERIFICADO aceptados o editados que no se usaron como respaldo. */
  unverifiedAdopted: number;
}

/**
 * La estrategia se calcula, no se guarda (FR-024, FR-025, SC-012). Un elemento aparece solo si tiene al menos un
 * hallazgo de respaldo aceptado o editado y verificado.
 */
export function deriveStrategy(
  template: StrategyTemplate,
  findings: readonly { id: string; verified: boolean }[],
  decisions: Record<string, Decision>,
): DerivedStrategy {
  const verified = new Map(findings.map((f) => [f.id, f.verified]));
  const derive = (items: StrategyItem[]): DerivedItem[] =>
    items
      .map((it) => ({
        ...it,
        derivedFrom: it.supportedBy.filter((id) => usesAsSupport(verified.get(id) ?? false, decisions[id]?.state ?? 'pending')),
      }))
      .filter((it) => it.derivedFrom.length > 0);
  const analysis = (a: AnalysisTemplate): DerivedAnalysis => {
    const from = a.implication.supportedBy.filter((id) => usesAsSupport(verified.get(id) ?? false, decisions[id]?.state ?? 'pending'));
    return { summary: a.summary, keyPoints: a.keyPoints, sources: a.sources, implication: from.length > 0 ? { text: a.implication.text, derivedFrom: from } : null };
  };
  const risks = derive(template.risks);
  const route = derive(template.route);
  return {
    sector: analysis(template.sector),
    market: analysis(template.market),
    risks,
    route,
    empty: risks.length === 0 && route.length === 0,
    unverifiedAdopted: countUnverifiedAdopted(findings, decisions),
  };
}
