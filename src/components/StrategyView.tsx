import type { Finding } from '../data/diagnosis';
import { AiBadge } from './AiBadge';
import { countOf } from '../domain/format';
import type { DerivedAnalysis, DerivedStrategy } from '../domain/strategy';
import { DerivedFrom } from './DerivedFrom';
import { SimBadge } from './badges';
import { RiskCard } from './RiskCard';
import { RouteTimeline } from './RouteTimeline';
import { ProvenancePanel, RiskLevelPanel, buildProvenance, titleOf } from './charts/Panels';

/** Línea de aviso: los NO VERIFICADO aceptados no respaldan la estrategia; solo con N > 0 (FR-025). */
function unverifiedLine(n: number): string {
  return n === 1
    ? '1 hallazgo aceptado no se usó como respaldo porque está NO VERIFICADO'
    : `${countOf(n, 'hallazgo aceptado', 'hallazgos aceptados')} no se usaron como respaldo porque están NO VERIFICADO`;
}

/** Análisis de solo lectura: resumen y puntos clave ilustrativos (NO VERIFICADO), implicación derivada de hallazgos y fuentes (FR-026). */
function AnalysisSection({ id, title, analysis }: { id: string; title: string; analysis: DerivedAnalysis }) {
  return (
    <section className="card" aria-labelledby={id} data-testid={id}>
      <h2 id={id}>{title}</h2>
      <p>
        <span className="badge badge-unverified">NO VERIFICADO · contenido ilustrativo</span>
      </p>
      <p>{analysis.summary}</p>
      <ul>
        {analysis.keyPoints.map((k) => (
          <li key={k}>{k}</li>
        ))}
      </ul>
      {analysis.implication ? (
        <div data-testid={`${id}-implicacion`}>
          <h3>Implicación para esta empresa</h3>
          <p>{analysis.implication.text}</p>
          <DerivedFrom itemId={id} ids={analysis.implication.derivedFrom} />
        </div>
      ) : (
        <p className="subtitle" data-testid={`${id}-sin-implicacion`}>
          Sin implicación para esta empresa: ningún hallazgo aceptado o editado y verificado la respalda.
        </p>
      )}
      <p className="subtitle">{analysis.sources}</p>
    </section>
  );
}

/**
 * `ai`: estrategia generada por el agente (modo IA real): rótulo de IA sin modelo, «Deriva de» con los hallazgos reales y SIN análisis de
 * sector ni mercado (no hay contenido ilustrativo en modo real). Sin `ai` es la vista de la 001, idéntica.
 */
export function StrategyView({ derived, ai = false, findings, adopted }: { derived: DerivedStrategy; ai?: boolean; findings?: readonly Finding[]; adopted?: readonly { id: string; title: string; verified: boolean }[] }) {
  // Hallazgos aceptados o editados (AG-035): si quien llama no los da, solo se muestran los que alguna acción usa (sin marcar «sin uso»).
  const used = [...new Set([...derived.risks, ...derived.route].flatMap((i) => i.derivedFrom))];
  const provenance = buildProvenance(derived, adopted ?? used.map((id) => ({ id, title: titleOf(id, findings), verified: true })));
  return (
    <div>
      {!ai && (
        <p>
          <SimBadge />
        </p>
      )}
      {derived.unverifiedAdopted > 0 && (
        <p className="subtitle no-support" data-testid="unverified-unused">
          {unverifiedLine(derived.unverifiedAdopted)}
        </p>
      )}
      {derived.empty ? (
        <section className="card" data-testid="strategy-empty" aria-labelledby="estr-vacia">
          <h2 id="estr-vacia">Sin elementos de estrategia</h2>
          <p>
            Ningún elemento de la estrategia tiene respaldo: solo se derivan de hallazgos aceptados o editados y verificados del
            diagnóstico emitido.
          </p>
        </section>
      ) : (
        <div data-testid="strategy-content" className="stack">
          <div className="strategy-charts">
            <RiskLevelPanel risks={derived.risks} />
            <ProvenancePanel data={provenance} />
          </div>
          <section aria-labelledby="estr-riesgos">
            <div className="block-head">
              <h2 id="estr-riesgos">Riesgos</h2>
              {ai && <AiBadge />}
            </div>
            <div className="stack risk-grid">
              {derived.risks.map((r) => (
                <RiskCard key={r.id} item={r} {...(findings ? { findings } : {})} />
              ))}
            </div>
          </section>
          <section aria-labelledby="estr-ruta">
            <div className="block-head">
              <h2 id="estr-ruta">Ruta sugerida</h2>
              {ai && <AiBadge />}
            </div>
            <RouteTimeline items={derived.route} {...(findings ? { findings } : {})} />
          </section>
          {!ai && <AnalysisSection id="estr-sector" title="Análisis de sector" analysis={derived.sector} />}
          {!ai && <AnalysisSection id="estr-mercado" title="Análisis de mercado" analysis={derived.market} />}
        </div>
      )}
    </div>
  );
}
