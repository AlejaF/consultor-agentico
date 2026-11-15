import { vistaHref } from '../app/vista';
import type { Finding } from '../data/diagnosis';
import { evaluateMaturity, maturityOf, type MaturityEvaluation } from '../domain/maturity';
import { levelBar } from '../domain/visual';
import { reviewStats } from '../domain/visual';
import type { PersistedState } from '../state/types';
import { AiBadge } from './AiBadge';
import { ReviewStatePanel } from './charts/Panels';
import { MaturityIndexCard } from './MaturityIndexCard';
import { RowState, label } from './MaturityPanel';
import { ScaleBar } from './ScaleBar';
import { SimBadge } from './badges';

type ProjectState = PersistedState['projects'][string];

/** Resumen de Diagnóstico (AG-036): lo esencial en una vista corta. Todo clic lleva al Detalle posicionado en su sección. Nada técnico. */
export function DiagnosisResumen({ projectId, ps, findings, real, issued }: { projectId: string; ps: ProjectState; findings: readonly Finding[]; real: boolean; issued: boolean }) {
  const d = ps.diagnosis;
  const s = reviewStats(findings, d.decisions);
  const verified = findings.length - s.unverified;
  const evaluation: MaturityEvaluation | null = real ? evaluateMaturity(ps.real?.maturity, findings, d.decisions) : null;
  const backing = new Set(evaluation?.levels.flatMap((l) => (l.status === 'backed' ? l.backing : [])) ?? []);
  const missing = real ? (ps.real?.missingInfo ?? []).length : 0;
  const cifra = (id: string, value: number, text: string) => (
    <div className="stat" data-testid={`resumen-cifra-${id}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{text}</span>
    </div>
  );
  return (
    <div className="resumen" data-testid="diagnostico-resumen">
        <section className="card maturity-panel resumen-madurez" aria-labelledby="resumen-madurez-t">
          <div className="block-head">
            <h2 id="resumen-madurez-t">Madurez por pilar</h2>
            {real ? <AiBadge /> : <SimBadge />}
          </div>
          <div className="maturity-layout">
            {evaluation ? <MaturityIndexCard index={evaluation.index} mode="real" basedOn={backing.size} /> : <MaturityIndexCard index={maturityOf(projectId)} mode="simulated" />}
            {evaluation && (
              <ul className="list-plain maturity-list">
                {evaluation.levels.map((l) => (
                  <li key={l.dimension} className="maturity-row" data-testid={`resumen-pilar-${l.dimension}`}>
                    <div className="row-head">
                      <a className="resumen-pilar-link" href={vistaHref(projectId, 'detalle', `pilar-${l.dimension}`)} aria-label={`Ver el pilar ${label(l.dimension)} en el detalle`}>
                        {label(l.dimension)}
                      </a>
                    </div>
                    <ScaleBar view={levelBar(l)} name={label(l.dimension)} compact />
                    <div className="row-state">
                      <RowState l={l} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      <div className="resumen-side">
        <section className="card resumen-cifras" aria-labelledby="resumen-cifras-t">
          <div className="block-head">
            <h2 id="resumen-cifras-t">Hallazgos</h2>
            {real ? <AiBadge /> : <SimBadge />}
          </div>
          <div className="stats-row">
            {cifra('hallazgos', findings.length, 'Hallazgos')}
            {cifra('verificados', verified, 'Verificados')}
            {cifra('noverificado', s.unverified, 'NO VERIFICADO')}
          </div>
        </section>
        <ReviewStatePanel findings={findings} decisions={d.decisions} />
      </div>
        <nav className="resumen-acciones" aria-label="Ir al detalle" data-testid="resumen-acciones">
          <a className="btn" href={vistaHref(projectId, 'detalle', 'hallazgos')}>
            Ver los {findings.length} hallazgos
          </a>
          {real && (
            <a className="btn" href={vistaHref(projectId, 'detalle', 'cobertura')}>
              Ver cobertura de evidencia
            </a>
          )}
          {real && missing > 0 && (
            <a className="btn" href={vistaHref(projectId, 'detalle', 'evidencia-sugerida')}>
              Ver evidencia sugerida ({missing})
            </a>
          )}
          <a className="btn primary" href={`#/consultor/proyectos/${projectId}/revision`}>
            {issued ? 'Ver la revisión' : 'Ir a la revisión'}
          </a>
        </nav>
    </div>
  );
}
