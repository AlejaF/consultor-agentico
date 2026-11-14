import { FindingCard } from '../../components/FindingCard';
import { GenerateButton } from '../../components/GenerateButton';
import { IssuedNotice } from '../../components/IssuedNotice';
import { PillarGroups } from '../../components/PillarGroups';
import { AiBadge } from '../../components/AiBadge';
import { MissingInfo } from '../../components/MissingInfo';
import { ModeSelector } from '../../components/ModeSelector';
import { RealGenerate } from '../../components/RealGenerate';
import { TraceView } from '../../components/TraceView';
import { SimBadge } from '../../components/badges';
import { getDiagnosis } from '../../providers';
import { buildEvidenceItems, resolveCitation } from '../../domain/evidence';
import { evaluateMaturity, maturityOf } from '../../domain/maturity';
import { MaturityPanel } from '../../components/MaturityPanel';
import { formatDateTime, formatDecimal } from '../../domain/format';
import { canGenerate } from '../../domain/progress';
import { projectInfo } from '../../domain/lookup';
import { useAppState } from '../../state/context';

export function Diagnosis({ projectId }: { projectId: string }) {
  const { state, dispatch } = useAppState();
  const { project, company } = projectInfo(projectId);
  const ps = state.projects[projectId];
  const d = ps.diagnosis;
  const view = getDiagnosis(ps);
  const real = view.mode === 'real';
  const aiModel = real ? (ps.real?.diagnosisRun?.model ?? 'desconocido') : undefined;
  const evidenceCount = real ? (ps.serverFiles ?? []).length : buildEvidenceItems(project, company.name, ps.localFiles).length;
  const issued = d.status === 'issued';

  const cited = real
    ? view.findings.filter((f) => (f.realCitations?.length ?? 0) > 0).length
    : view.findings.filter((f) => f.citations.some((c) => resolveCitation(c, company.name) !== null)).length;

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

      <ModeSelector projectId={projectId} />

      {d.status === 'none' && real && <RealGenerate projectId={projectId} companyName={company.name} />}

      {d.status === 'none' && !real && (
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
              {real ? <AiBadge model={aiModel!} /> : <SimBadge />}
            </p>
            {real && ps.real?.diagnosisRun?.partial && (
              <p className="subtitle no-support" data-testid="partial-notice">
                Resultado parcial: el agente alcanzó un tope antes de terminar. Revisa los avisos de la traza.
              </p>
            )}
            {issued && d.issuedAt && <p className="subtitle">Emitido el {formatDateTime(d.issuedAt)}</p>}
            {issued && <IssuedNotice projectId={projectId} />}
            {!real && (
              <p>
                <strong>Índice de madurez: {formatDecimal(maturityOf(projectId))} de 5</strong> (ilustrativo, ficticio)
              </p>
            )}
            <p data-testid="cited-count">
              {cited} de {view.findings.length} hallazgos con evidencia citada
            </p>
            <p>
              <a className="btn primary" href={`#/consultor/proyectos/${projectId}/revision`}>
                {issued ? 'Ver la revisión' : 'Ir a la revisión'}
              </a>{' '}
              {issued && (
                <a className="btn" href={`#/consultor/proyectos/${projectId}/informe`}>
                  Ver informe imprimible
                </a>
              )}
            </p>
          </section>

          {real && <MaturityPanel evaluation={evaluateMaturity(ps.real?.maturity, view.findings, d.decisions)} model={aiModel!} />}

          <PillarGroups
            idPrefix="dim"
            findings={view.findings}
            render={(f) => (
              <FindingCard
                key={f.id}
                finding={f}
                {...(aiModel ? { aiModel } : {})}
                companyName={company.name}
                decision={issued ? d.decisions[f.id] : undefined}
                mode={issued ? 'readonly' : 'report'}
                issued={issued}
              />
            )}
          />
          {real && <MissingInfo items={ps.real?.missingInfo ?? []} model={aiModel!} />}
          {real && ps.real?.diagnosisRun && <TraceView run={ps.real.diagnosisRun} />}
        </>
      )}
    </>
  );
}
