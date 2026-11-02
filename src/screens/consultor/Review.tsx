import { useState } from 'react';
import { FINDING_IDS } from '../../data/diagnosis';
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
  const { company } = projectInfo(projectId);
  const d = state.projects[projectId].diagnosis;
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
      <h1>Revisión y emisión</h1>
      <p>
        {company.name} · Proyecto {projectId}
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
            <SimBadge />
          </p>
          <p>
            {countOf(counts.accepted + counts.edited, 'incluido', 'incluidos')} ({countOf(counts.accepted, 'aceptado', 'aceptados')},{' '}
            {countOf(counts.edited, 'editado', 'editados')}) y {countOf(counts.rejected, 'excluido', 'excluidos')} (rechazados).
          </p>
          <IssuedNotice projectId={projectId} />
        </section>
      )}
      {issued && (
        <DeliveryStatus deliveryId={`dx/${projectId}`} label="el diagnóstico" />
      )}

      <div aria-live="polite" role="status" className="visually-hidden" data-testid="decision-announcer">
        {announcement}
      </div>

      {d.status !== 'none' && (
        <PillarGroups
          idPrefix="rev"
          render={(f) => (
            <FindingCard
              key={f.id}
              finding={f}
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
    </>
  );
}
