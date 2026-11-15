import { vistaHref } from '../app/vista';
import type { Finding } from '../data/diagnosis';
import { evaluateMaturity, maturityOf, type MaturityEvaluation } from '../domain/maturity';
import { countOf } from '../domain/format';
import { levelBar } from '../domain/visual';
import { reviewStats } from '../domain/visual';
import type { PersistedState } from '../state/types';
import { AiBadge } from './AiBadge';
import { ReviewStatePanel } from './charts/Panels';
import { MaturityIndexCard } from './MaturityIndexCard';
import { RowState, label } from './MaturityPanel';
import { ScaleBar } from './ScaleBar';
import { SimBadge } from './badges';
import { RunNoticesResumen } from './TraceView';

type ProjectState = PersistedState['projects'][string];

/** Resumen de Diagnóstico (AG-036): lo esencial en una vista corta. Todo clic lleva al Detalle posicionado en su sección. Nada técnico. */
export function DiagnosisResumen({ projectId, ps, findings, real, issued }: { projectId: string; ps: ProjectState; findings: readonly Finding[]; real: boolean; issued: boolean }) {
  const d = ps.diagnosis;
  const s = reviewStats(findings, d.decisions);
  const verified = findings.length - s.unverified;
  const evaluation: MaturityEvaluation | null = real ? evaluateMaturity(ps.real?.maturity, findings, d.decisions) : null;
  const backing = new Set(evaluation?.levels.flatMap((l) => (l.status === 'backed' ? l.backing : [])) ?? []);
  const missing = real ? (ps.real?.missingInfo ?? []).length : 0;
  return (
    <>
      {real && ps.real?.diagnosisRun && <RunNoticesResumen run={ps.real.diagnosisRun} href={vistaHref(projectId, 'detalle')} />}
    <div className="resumen" data-testid="diagnostico-resumen">
        <section className="card maturity-panel resumen-madurez" aria-labelledby="resumen-madurez-t">
          <div className="block-head">
            <h2 id="resumen-madurez-t">Madurez por pilar</h2>
            {real ? <AiBadge /> : <SimBadge />}
          </div>
          <div className="maturity-layout">
            {evaluation ? <MaturityIndexCard index={evaluation.index} mode="real" basedOn={backing.size} /> : <MaturityIndexCard index={maturityOf(projectId)} mode="simulated" />}
            {!evaluation && (
              <p className="subtitle" data-testid="resumen-sin-niveles">
                Este proyecto es Simulado y ese modo no tiene niveles por pilar: solo muestra el índice, que es ilustrativo y ficticio. Los niveles por pilar existen con la IA real.
              </p>
            )}
            {evaluation && (
              <ul className="list-plain maturity-list">
                {evaluation.levels.map((l) => (
                  <li key={l.dimension} className="maturity-row" data-testid={`resumen-pilar-${l.dimension}`}>
                    <div className="row-head">
                      <a className="resumen-pilar-link" href={vistaHref(projectId, 'detalle', `pilar-${l.dimension}`)} aria-label={`Ver el pilar ${label(l.dimension)} en el detalle`}>
                        {label(l.dimension)}&nbsp;<span aria-hidden="true">›</span>
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
        <ReviewStatePanel
          findings={findings}
          decisions={d.decisions}
          title="Estado de los hallazgos"
          badge={real ? <AiBadge /> : <SimBadge />}
          summary={<span data-testid="resumen-estado-linea">{`${countOf(findings.length, 'hallazgo', 'hallazgos')} · ${countOf(verified, 'verificado', 'verificados')} · ${s.unverified} NO VERIFICADO`}</span>}
          footer={
            <p className="subtitle resumen-leyenda" data-testid="resumen-leyenda-estado">
              <strong>Verificados</strong>: comprobado por código. <strong>Aceptados</strong>: decisión de la persona.
            </p>
          }
        />
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
    </>
  );
}
