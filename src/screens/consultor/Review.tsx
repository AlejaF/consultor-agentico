import { Kicker } from '../../components/Kicker';
import { useState } from 'react';
import { getDiagnosis } from '../../providers';
import { AiBadge } from '../../components/AiBadge';
import { RunNotices } from '../../components/TraceView';
import { ReviewStats } from '../../components/ReviewStats';
import { CoveragePanel } from '../../components/charts/Panels';
import { MaturityPanel } from '../../components/MaturityPanel';
import { evaluateMaturity } from '../../domain/maturity';
import { FindingCard } from '../../components/FindingCard';
import { DeliveryStatus } from '../../components/DeliveryStatus';
import { IssuedNotice } from '../../components/IssuedNotice';
import { PillarGroups } from '../../components/PillarGroups';
import { ReviewSummary } from '../../components/ReviewSummary';
import { SimBadge } from '../../components/badges';
import { countOf, formatDateTime } from '../../domain/format';
import { projectInfo } from '../../domain/lookup';
import { issueBlockReason, reviewProgress } from '../../domain/review';
import { useAppState } from '../../state/context';

export function Review({ projectId }: { projectId: string }) {
  const { state, dispatch } = useAppState();
  const { company } = projectInfo(projectId, state.createdProjects);
  const ps = state.projects[projectId];
  const d = ps.diagnosis;
  const view = getDiagnosis(ps);
  const ai = view.mode === 'real';
  const FINDING_IDS = view.ids;
  const [announcement, setAnnouncement] = useState('');
  const issued = d.status === 'issued';

  const decisionList = FINDING_IDS.map((id) => d.decisions[id]?.state ?? 'pending');
  const counts = {
    accepted: decisionList.filter((s) => s === 'accepted').length,
    edited: decisionList.filter((s) => s === 'edited').length,
    rejected: decisionList.filter((s) => s === 'rejected').length,
  };
  const progress = reviewProgress(FINDING_IDS, d.decisions);

  return (
    <>
      <p>
        <a className="btn" href={`#/consultor/proyectos/${projectId}/diagnostico`}>
          ← Diagnóstico
        </a>
      </p>
      <Kicker>PASO 3 · REVISIÓN</Kicker>
      <h1>Revisión y emisión</h1>
      <p>
        {company.name} · Proyecto {projectId} ·{' '}
        <span className="proposito" data-testid="proposito">
          Lo que tú decides: aceptar, editar o rechazar cada hallazgo
        </span>
      </p>

      {d.status === 'none' && (
        <section className="card" aria-labelledby="sin-dx">
          <h2 id="sin-dx">Aún no hay diagnóstico para revisar</h2>
          <p>Primero genera el diagnóstico; después podrás aceptar, editar o rechazar cada hallazgo.</p>
          <p>
            <a className="btn primary" href={`#/consultor/proyectos/${projectId}/diagnostico`}>
              Ir a generar el diagnóstico
            </a>
          </p>
        </section>
      )}

      {d.status !== 'none' ? (
        <div className="split" data-testid="split">
          <aside className="split-side" aria-label="Avance y madurez">
      {d.status === 'generated' && (
        <ReviewSummary
          {...progress}
          {...counts}
          blockReason={issueBlockReason(FINDING_IDS, d.decisions)}
          onIssue={() => {
            dispatch({ type: 'issue', projectId, at: new Date().toISOString() });
            setAnnouncement('Diagnóstico emitido.');
          }}
        />
      )}

      {issued && (
        <section className="card" aria-labelledby="emitido">
          <h2 id="emitido">
            <span className="badge badge-ok">Emitido</span>
          </h2>
          <p>
            Emitido el {d.issuedAt ? formatDateTime(d.issuedAt) : ''}. Es de solo lectura.{' '}
            {ai ? <AiBadge /> : <SimBadge />}
          </p>
          <p>
            {countOf(counts.accepted + counts.edited, 'incluido', 'incluidos')} ({countOf(counts.accepted, 'aceptado', 'aceptados')},{' '}
            {countOf(counts.edited, 'editado', 'editados')}) y {countOf(counts.rejected, 'excluido', 'excluidos')} (rechazados).
          </p>
          <IssuedNotice projectId={projectId} />
        </section>
      )}
      {issued && (
        <DeliveryStatus deliveryId={`dx/${projectId}`} label="del diagnóstico" />
      )}

      {ai && <MaturityPanel evaluation={evaluateMaturity(ps.real?.maturity, view.findings, d.decisions)} />}
          </aside>
          <div className="split-main">
      <div aria-live="polite" role="status" className="visually-hidden" data-testid="decision-announcer">
        {announcement}
      </div>

      {<ReviewStats findings={view.findings} decisions={d.decisions} />}
      {ai && <CoveragePanel findings={view.findings} decisions={d.decisions} />}
      {ai && ps.real?.diagnosisRun && <RunNotices run={ps.real.diagnosisRun} />}
      {(
        <PillarGroups
          idPrefix="rev"
          findings={view.findings}
          render={(f) => (
            <FindingCard
              key={f.id}
              finding={f}
              {...(ai ? { ai } : {})}
              companyName={company.name}
              decision={d.decisions[f.id]}
              mode={issued ? 'readonly' : 'review'}
              issued={issued}
              onDecide={(decision) => {
                dispatch({ type: 'decide', projectId, findingId: f.id, decision });
                setAnnouncement(`Hallazgo «${f.title}»: ${decision === 'accepted' ? 'aceptado' : 'rechazado'}.`);
              }}
              onEdit={(text) => {
                dispatch({ type: 'edit', projectId, findingId: f.id, text });
                setAnnouncement(`Hallazgo «${f.title}»: editado.`);
              }}
            />
          )}
        />
      )}
          </div>
        </div>
      ) : null}
    </>
  );
}
