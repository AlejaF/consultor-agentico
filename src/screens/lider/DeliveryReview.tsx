import { useState } from 'react';
import { FindingCard } from '../../components/FindingCard';
import { GradeSummary } from '../../components/GradeSummary';
import { PillarGroups } from '../../components/PillarGroups';
import { RubricForm } from '../../components/RubricForm';
import { StrategyView } from '../../components/StrategyView';
import { SimBadge } from '../../components/badges';
import { UnverifiedCount } from '../../components/UnverifiedCount';
import { AiBadge } from '../../components/AiBadge';
import { RunNotices, TraceView } from '../../components/TraceView';
import { getDiagnosis, getStrategy } from '../../providers';
import { evaluateMaturity, maturityOf } from '../../domain/maturity';
import { MaturityPanel } from '../../components/MaturityPanel';
import { countOf, formatDecimal } from '../../domain/format';
import { projectInfo } from '../../domain/lookup';
import { deriveStrategy } from '../../domain/strategy';
import { useAppState } from '../../state/context';

/** Revisión de una entrega por el Líder: contenido en solo lectura y rúbrica (FR-029 a FR-031, FR-033). */
export function DeliveryReview({ tipo, projectId }: { tipo: 'dx' | 'st'; projectId: string }) {
  const { state, dispatch } = useAppState();
  const { company, team } = projectInfo(projectId, state.createdProjects);
  const ps = state.projects[projectId];
  const deliveryId = `${tipo}/${projectId}`;
  const grading = state.gradings[deliveryId];
  const [announcement, setAnnouncement] = useState('');
  const decisions = ps.diagnosis.decisions;
  const view = getDiagnosis(ps);
  const ai = view.mode === 'real';
  const excluded = view.ids.filter((id) => decisions[id]?.state === 'rejected').length;

  return (
    <>
      <p>
        <a className="btn" href="#/lider/entregas">
          ← Entregas por revisar
        </a>
      </p>
      <h1>Revisión de la entrega</h1>
      <p>
        {tipo === 'dx' ? 'Diagnóstico' : 'Estrategia'} · {company.name} · {team.name} · Proyecto {projectId}
      </p>
      <UnverifiedCount projectId={projectId} />
      <p>
        <a className="btn" href={`#/lider/entregas/${tipo}/${projectId}/informe`}>
          Ver informe imprimible
        </a>
      </p>
      <p className="subtitle">
        Vista de solo lectura. El Líder califica la calidad del entregable: no lo aprueba ni edita su contenido.
      </p>

      {tipo === 'dx' ? (
        <section aria-labelledby="entrega-dx">
          <h2 id="entrega-dx">Diagnóstico emitido</h2>
          <p>{ai ? <AiBadge /> : <SimBadge />}</p>
          {ai && ps.real?.diagnosisRun && <RunNotices run={ps.real.diagnosisRun} />}
          {!ai && (
            <p>
              <strong>Índice de madurez: {formatDecimal(maturityOf(projectId))} de 5</strong> (ilustrativo, ficticio)
            </p>
          )}
          {ai && <MaturityPanel evaluation={evaluateMaturity(ps.real?.maturity, view.findings, decisions)} />}
          {excluded > 0 && <p className="subtitle">{countOf(excluded, 'hallazgo excluido', 'hallazgos excluidos')} por el Consultor (no se muestran).</p>}
          <PillarGroups
            idPrefix="ent"
            findings={view.findings}
            filter={(f) => decisions[f.id]?.state !== 'rejected'}
            render={(f) => (
              <FindingCard key={f.id} finding={f} companyName={company.name} decision={decisions[f.id]} mode="readonly" issued {...(ai ? { ai } : {})} />
            )}
          />
          {ai && ps.real?.diagnosisRun && <TraceView run={ps.real.diagnosisRun} />}
        </section>
      ) : (
        <section aria-labelledby="entrega-st">
          <h2 id="entrega-st">Estrategia enviada</h2>
          {ai && ps.real?.strategyRun && <RunNotices run={ps.real.strategyRun} />}
          <StrategyView derived={deriveStrategy(getStrategy(ps).template, view.findings, decisions)} ai={ai} {...(ai ? { findings: view.findings } : {})} adopted={view.findings.filter((f) => ['accepted', 'edited'].includes(decisions[f.id]?.state ?? 'pending'))} />
          {ai && ps.real?.strategyRun && <TraceView run={ps.real.strategyRun} />}
        </section>
      )}

      <div aria-live="polite" role="status" className="visually-hidden">
        {announcement}
      </div>
      {grading ? (
        <GradeSummary grading={grading} title="Calificación guardada" />
      ) : (
        <RubricForm
          onSave={(levels, comment) => {
            dispatch({ type: 'saveGrading', deliveryId, levels, comment, at: new Date().toISOString() });
            setAnnouncement('Calificación guardada.');
          }}
        />
      )}
    </>
  );
}
