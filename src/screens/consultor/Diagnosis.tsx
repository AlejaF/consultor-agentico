import { useEffect } from 'react';
import { Kicker } from '../../components/Kicker';
import { FindingCard } from '../../components/FindingCard';
import { GenerateButton } from '../../components/GenerateButton';
import { IssuedNotice } from '../../components/IssuedNotice';
import { PillarGroups } from '../../components/PillarGroups';
import { AiBadge } from '../../components/AiBadge';
import { MissingInfo } from '../../components/MissingInfo';
import { ModeSelector } from '../../components/ModeSelector';
import { RealGenerate } from '../../components/RealGenerate';
import { RunNotices, TraceView } from '../../components/TraceView';
import { SimBadge } from '../../components/badges';
import { getDiagnosis } from '../../providers';
import { buildEvidenceItems, resolveCitation } from '../../domain/evidence';
import { evaluateMaturity, maturityOf } from '../../domain/maturity';
import { MaturityPanel } from '../../components/MaturityPanel';
import { MaturityIndexCard } from '../../components/MaturityIndexCard';
import { ReviewStats } from '../../components/ReviewStats';
import { CoveragePanel } from '../../components/charts/Panels';
import { formatDateTime, formatDecimal } from '../../domain/format';
import { canGenerate } from '../../domain/progress';
import { projectInfo } from '../../domain/lookup';
import { useAppState } from '../../state/context';
import { DiagnosisResumen } from '../../components/DiagnosisResumen';
import { VistaControl } from '../../components/VistaControl';
import { sectionTargetId, vistaInicial, type Vista } from '../../app/vista';
import { DIMENSIONS } from '../../data/diagnosis';

export function Diagnosis({ projectId, vista: vistaRuta, seccion }: { projectId: string; vista?: string; seccion?: string }) {
  const { state, dispatch } = useAppState();
  const { project, company } = projectInfo(projectId, state.createdProjects);
  const ps = state.projects[projectId];
  const d = ps.diagnosis;
  const view = getDiagnosis(ps);
  const real = view.mode === 'real';
  const evidenceCount = real ? (ps.serverFiles ?? []).length : buildEvidenceItems(project, company.name, ps.localFiles).length;
  const issued = d.status === 'issued';
  // AG-036: la ruta base abre la vista inicial (compilación); sin diagnóstico no hay nada que resumir y se muestra la pantalla de generar.
  const vista: Vista = d.status === 'none' ? 'detalle' : vistaRuta === 'resumen' || vistaRuta === 'detalle' ? vistaRuta : vistaInicial();
  const pilaresConHallazgos = DIMENSIONS.filter((dim) => view.findings.some((f) => f.dimension === dim.id)).map((dim) => dim.id as string);
  const destino = vista === 'detalle' ? sectionTargetId(seccion, pilaresConHallazgos) : null;
  useEffect(() => {
    if (!destino) return;
    // Después del foco automático en el h1 (AppShell): mueve el foco al encabezado de la sección y lo deja a la vista.
    const alinear = () => {
      const el = document.getElementById(destino);
      if (!el) return;
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: 'start' });
    };
    const t = window.setTimeout(alinear, 0);
    const t2 = window.setTimeout(() => document.getElementById(destino)?.scrollIntoView({ block: 'start' }), 250); // por si el contenido cambió de alto
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [destino, projectId, d.status]);

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
      <Kicker>PASO 2 · DIAGNÓSTICO</Kicker>
      <h1>Diagnóstico</h1>
      <p>
        {company.name} · Proyecto {projectId} ·{' '}
        <span className="proposito" data-testid="proposito">
          Lo que encontró el agente (solo lectura)
        </span>
        {vista === 'resumen' && d.status !== 'none' && (
          <>
            {' '}
            <span className="badge badge-pending" data-testid="resumen-modo">
              {real ? 'IA real' : 'Simulado'}
            </span>
          </>
        )}
      </p>

      {d.status !== 'none' && <VistaControl projectId={projectId} vista={vista} />}

      {vista === 'resumen' && d.status !== 'none' ? (
        <DiagnosisResumen projectId={projectId} ps={ps} findings={view.findings} real={real} issued={issued} />
      ) : (
      <>
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
        <div className="split" data-testid="split">
          <aside className="split-side" aria-label="Resumen y madurez">
          <section className="card report-head" aria-label="Resumen del diagnóstico">
            <p>
              <span className={issued ? 'badge badge-ok' : 'badge badge-warn'}>{issued ? 'Emitido' : 'Generado — pendiente de revisión'}</span>{' '}
              {real ? <AiBadge /> : <SimBadge />}
            </p>
            {real && ps.real?.diagnosisRun && <RunNotices run={ps.real.diagnosisRun} />}
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

          {!real && <MaturityIndexCard index={maturityOf(projectId)} mode="simulated" />}
          {real && <MaturityPanel evaluation={evaluateMaturity(ps.real?.maturity, view.findings, d.decisions)} />}
          </aside>
          <div className="split-main">
          <ReviewStats findings={view.findings} decisions={d.decisions} />
          {real && <CoveragePanel findings={view.findings} decisions={d.decisions} />}

          <PillarGroups
            idPrefix="dim"
            findings={view.findings}
            render={(f) => (
              <FindingCard
                key={f.id}
                finding={f}
                {...(real ? { ai: true } : {})}
                companyName={company.name}
                decision={issued ? d.decisions[f.id] : undefined}
                mode={issued ? 'readonly' : 'report'}
                issued={issued}
              />
            )}
          />
          {real && <MissingInfo items={ps.real?.missingInfo ?? []} />}
          {real && ps.real?.diagnosisRun && <TraceView run={ps.real.diagnosisRun} />}
          </div>
        </div>
      )}
      </>
      )}
    </>
  );
}
