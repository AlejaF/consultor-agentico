import type { StrategyTemplate } from '../data/strategy';
import type { StrategyRequest } from '../providers/types';
import type { Decision, RealFinding, RealState } from '../state/types';
import { usesAsSupport } from './review';

/**
 * Hallazgos que pueden respaldar la estrategia real (AG-019, FR-025): aceptados o editados Y verificados. Solo ellos se envían al
 * servicio; sin ninguno no se puede generar y no se llama al modelo.
 */
export function strategyBackedFindings(findings: readonly RealFinding[], decisions: Record<string, Decision>): RealFinding[] {
  return findings.filter((f) => usesAsSupport(f.verified, decisions[f.id]?.state ?? 'pending'));
}

/** Cuerpo de `POST /api/strategy/run`: el texto vigente (el editado, si lo hubo) y solo los extractos citados. */
export function buildStrategyRequest(projectId: string, empresa: string, findings: readonly RealFinding[], decisions: Record<string, Decision>): StrategyRequest {
  return {
    projectId,
    empresa,
    findings: strategyBackedFindings(findings, decisions).map((f) => {
      const d = decisions[f.id];
      return {
        id: f.id,
        dimension: f.dimension,
        title: f.title,
        text: d?.state === 'edited' ? d.text : f.text,
        state: d?.state === 'edited' ? ('edited' as const) : ('accepted' as const),
        quotes: f.citations.filter((c) => c.verified).map((c) => ({ file: c.file, location: c.location, quote: c.quote })),
      };
    }),
  };
}

const NO_ANALYSIS = { summary: '', keyPoints: [] as unknown as [string, string, string], implication: { text: '', supportedBy: [] as string[] }, sources: '' };

/**
 * La plantilla que ve `deriveStrategy` en modo real: los riesgos y la ruta guardados; sector y mercado vacíos (no hay análisis
 * ilustrativo en modo real). `deriveStrategy` no cambia (SC-A4, SC-012).
 */
export function realStrategyTemplate(real: Pick<RealState, 'strategy'> | undefined): StrategyTemplate {
  return { risks: [...(real?.strategy?.risks ?? [])], route: [...(real?.strategy?.route ?? [])], sector: NO_ANALYSIS, market: NO_ANALYSIS };
}
