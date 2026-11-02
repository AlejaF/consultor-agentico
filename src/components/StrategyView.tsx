import { countOf } from '../domain/format';
import type { DerivedAnalysis, DerivedStrategy } from '../domain/strategy';
import { DerivedFrom } from './DerivedFrom';
import { SimBadge } from './badges';
import { RiskCard } from './RiskCard';
import { RouteTimeline } from './RouteTimeline';

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

export function StrategyView({ derived }: { derived: DerivedStrategy }) {
  return (
    <div>
      <p>
        <SimBadge />
      </p>
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
          <section aria-labelledby="estr-riesgos">
            <h2 id="estr-riesgos">Riesgos</h2>
            <div className="stack">
              {derived.risks.map((r) => (
                <RiskCard key={r.id} item={r} />
              ))}
            </div>
          </section>
          <section aria-labelledby="estr-ruta">
            <h2 id="estr-ruta">Ruta sugerida</h2>
            <RouteTimeline items={derived.route} />
          </section>
          <AnalysisSection id="estr-sector" title="Análisis de sector" analysis={derived.sector} />
          <AnalysisSection id="estr-mercado" title="Análisis de mercado" analysis={derived.market} />
        </div>
      )}
    </div>
  );
}
