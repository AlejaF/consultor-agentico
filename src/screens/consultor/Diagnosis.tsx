import { DIAGNOSIS } from '../../data/diagnosis';
import { FindingCard } from '../../components/FindingCard';
import { GenerateButton } from '../../components/GenerateButton';
import { IssuedNotice } from '../../components/IssuedNotice';
import { PillarGroups } from '../../components/PillarGroups';
import { SimBadge } from '../../components/badges';
import { buildEvidenceItems, resolveCitation } from '../../domain/evidence';
import { formatDateTime, formatDecimal } from '../../domain/format';
import { canGenerate } from '../../domain/progress';
import { projectInfo } from '../../domain/lookup';
import { useAppState } from '../../state/context';

export function Diagnosis({ projectId }: { projectId: string }) {
  const { state, dispatch } = useAppState();
  const { project, company } = projectInfo(projectId);
  const ps = state.projects[projectId];
  const d = ps.diagnosis;
  const evidenceCount = buildEvidenceItems(project, company.name, ps.localFiles).length;
  const issued = d.status === 'issued';

  const cited = DIAGNOSIS.findings.filter((f) => f.citations.some((c) => resolveCitation(c, company.name) !== null)).length;

  return (
    <>
      <p>
        <a className="btn" href={`#/consultor/proyectos/${projectId}/evidencia`}>
          ← Captura de evidencia
        </a>
      </p>
      <h1>Diagnóstico</h1>
      <p>
        {company.name} · Proyecto {projectId}
      </p>

      {d.status === 'none' && (
        <section className="card" aria-labelledby="gen-titulo">
          <h2 id="gen-titulo">Generar diagnóstico</h2>
          <p>El diagnóstico se genera a partir de la evidencia del proyecto. En esta demo el contenido es preparado y está rotulado como simulado.</p>
          <GenerateButton
            label="Generar diagnóstico"
            runningLabel="Generando diagnóstico…"
            blocked={
              canGenerate(evidenceCount)
                ? undefined
                : {
                    reason: 'Carga al menos un archivo para poder generar el diagnóstico.',
                    href: `#/consultor/proyectos/${projectId}/evidencia`,
                    linkLabel: 'Ir a la captura de evidencia',
                  }
            }
            onDone={() => dispatch({ type: 'generate', projectId, at: new Date().toISOString() })}
          />
        </section>
      )}

      {d.status !== 'none' && (
        <>
          <section className="card report-head" aria-label="Resumen del diagnóstico">
            <p>
              <span className={issued ? 'badge badge-ok' : 'badge badge-warn'}>{issued ? 'Emitido' : 'Generado — pendiente de revisión'}</span>{' '}
              <SimBadge />
            </p>
            {issued && d.issuedAt && <p className="subtitle">Emitido el {formatDateTime(d.issuedAt)}</p>}
            {issued && <IssuedNotice projectId={projectId} />}
            <p>
              <strong>Índice de madurez: {formatDecimal(DIAGNOSIS.maturityIndex)} de 5</strong>
            </p>
            <p data-testid="cited-count">
              {cited} de {DIAGNOSIS.findings.length} hallazgos con evidencia citada
            </p>
            <p>
              <a className="btn primary" href={`#/consultor/proyectos/${projectId}/revision`}>
                {issued ? 'Ver la revisión' : 'Ir a la revisión'}
              </a>
            </p>
          </section>

          <PillarGroups
            idPrefix="dim"
            render={(f) => (
              <FindingCard
                key={f.id}
                finding={f}
                companyName={company.name}
                decision={issued ? d.decisions[f.id] : undefined}
                mode={issued ? 'readonly' : 'report'}
                issued={issued}
              />
            )}
          />
        </>
      )}
    </>
  );
}
