import { STRATEGY } from '../data/strategy';
import { countOf } from '../domain/format';
import type { DerivedStrategy } from '../domain/strategy';
import { SimBadge } from './badges';
import { RiskCard } from './RiskCard';
import { RouteTimeline } from './RouteTimeline';

/** Línea de aviso: los NO VERIFICADO aceptados no respaldan la estrategia; solo con N > 0 (FR-025). */
function unverifiedLine(n: number): string {
  return n === 1
    ? '1 hallazgo aceptado no se usó como respaldo porque está NO VERIFICADO'
    : `${countOf(n, 'hallazgo aceptado', 'hallazgos aceptados')} no se usaron como respaldo porque están NO VERIFICADO`;
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
          <section className="card" aria-labelledby="estr-sector">
            <h2 id="estr-sector">Análisis de sector</h2>
            <p>
              <span className="badge badge-unverified">NO VERIFICADO · contenido ilustrativo</span>
            </p>
            <p>{STRATEGY.sectorAnalysis}</p>
          </section>
          <section className="card" aria-labelledby="estr-mercado">
            <h2 id="estr-mercado">Análisis de mercado</h2>
            <p>
              <span className="badge badge-unverified">NO VERIFICADO · contenido ilustrativo</span>
            </p>
            <p>{STRATEGY.marketAnalysis}</p>
          </section>
        </div>
      )}
    </div>
  );
}
