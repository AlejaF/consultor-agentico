import { DIMENSIONS } from '../data/diagnosis';
import { resolveName } from '../data/evidence';
import { resolveCitation } from '../domain/evidence';
import { countOf, formatDateTime, formatDecimal } from '../domain/format';
import type { ReportContent } from '../domain/report';
import { SimBadge, UnverifiedBadge } from './badges';
import { pillarLabel } from './PillarGroups';
import { StrategyView } from './StrategyView';

type Available = Extract<ReportContent, { available: true }>;

/**
 * Cuerpo del informe imprimible (FR-044 a FR-048). La cabecera «DEMO · datos ficticios» va en el `thead` de una tabla de maquetación:
 * el navegador repite el `thead` en cada página impresa y le reserva su espacio (print.css). En pantalla no se ve (ya está el aviso de la app).
 */
export function PrintReport({ content, companyName, projectLabel }: { content: Available; companyName: string; projectLabel: string }) {
  const includedLine = `${countOf(content.findings.length, 'hallazgo incluido', 'hallazgos incluidos')}`;
  return (
    <div className="print-report" data-testid="print-report">
      <table role="presentation" className="print-frame">
        <thead>
          <tr>
            <td>
              <div className="print-banner" data-testid="print-banner">
                DEMO · datos ficticios
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <header className="print-head">
                <p className="print-title">
                  {companyName} · {projectLabel}
                </p>
                <p>
                  <SimBadge /> {content.issuedAt && <span>Diagnóstico emitido el {formatDateTime(content.issuedAt)}</span>}
                </p>
                <p>
                  <strong>Índice de madurez: {formatDecimal(content.maturityIndex)} de 5</strong> (ilustrativo, ficticio)
                </p>
                <p>
                  {includedLine}
                  {content.unverifiedShown > 0 && (
                    <>
                      , de los cuales {countOf(content.unverifiedShown, 'está', 'están')} <UnverifiedBadge />
                    </>
                  )}
                  .
                </p>
                <p data-testid="report-excluded">
                  {content.excluded > 0
                    ? `${countOf(content.excluded, 'hallazgo excluido', 'hallazgos excluidos')} por el Consultor (no ${content.excluded === 1 ? 'se muestra' : 'se muestran'})`
                    : 'Ningún hallazgo fue excluido por el Consultor'}
                </p>
              </header>

              <section aria-labelledby="inf-dx">
                <h2 id="inf-dx">Diagnóstico</h2>
                {DIMENSIONS.map((dim) => {
                  const list = content.findings.filter((f) => f.finding.dimension === dim.id);
                  if (list.length === 0) return null;
                  return (
                    <section key={dim.id} aria-labelledby={`inf-${dim.id}`}>
                      <h3 id={`inf-${dim.id}`}>{pillarLabel(dim.label)}</h3>
                      {list.map(({ finding, editedText }) => (
                        <article key={finding.id} className="print-finding">
                          <h4>
                            {finding.title} {!finding.verified && <UnverifiedBadge />}
                          </h4>
                          <p>{editedText ?? resolveName(finding.text, companyName)}</p>
                          {editedText && (
                            <p>
                              <span className="badge badge-warn">Editado por consultor</span>
                            </p>
                          )}
                          {!finding.verified && finding.unverifiedReason && <p className="subtitle">{finding.unverifiedReason}</p>}
                          {finding.citations
                            .map((c) => resolveCitation(c, companyName))
                            .filter((c) => c !== null)
                            .map((c) => (
                              <blockquote key={c.excerptId}>
                                <p>
                                  <span className="badge badge-sim">Evidencia de ejemplo (ficticia)</span>
                                </p>
                                <p>«{c.text}»</p>
                                <footer>{c.label}</footer>
                              </blockquote>
                            ))}
                        </article>
                      ))}
                    </section>
                  );
                })}
              </section>

              {content.strategy.kind === 'unavailable' && (
                <section aria-labelledby="inf-st">
                  <h2 id="inf-st">Estrategia</h2>
                  <p>{content.strategy.note}</p>
                </section>
              )}
              {content.strategy.kind === 'derived' && (
                <section aria-labelledby="inf-st">
                  <h2 id="inf-st">Estrategia</h2>
                  <StrategyView derived={content.strategy.derived} />
                </section>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
