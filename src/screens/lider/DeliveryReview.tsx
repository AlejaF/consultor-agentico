import { useState } from 'react';
import { FindingCard } from '../../components/FindingCard';
import { GradeSummary } from '../../components/GradeSummary';
import { PillarGroups } from '../../components/PillarGroups';
import { RubricForm } from '../../components/RubricForm';
import { StrategyView } from '../../components/StrategyView';
import { SimBadge } from '../../components/badges';
import { UnverifiedCount } from '../../components/UnverifiedCount';
import { AiBadge } from '../../components/AiBadge';
import { getDiagnosis } from '../../providers';
import { STRATEGY } from '../../data/strategy';
import { evaluateMaturity, maturityOf } from '../../domain/maturity';
import { MaturityPanel } from '../../components/MaturityPanel';
import { countOf, formatDecimal } from '../../domain/format';
import { projectInfo } from '../../domain/lookup';
import { deriveStrategy } from '../../domain/strategy';
import { useAppState } from '../../state/context';

/** Revisión de una entrega por el Líder: contenido en solo lectura y rúbrica (FR-029 a FR-031, FR-033). */
export function DeliveryReview({ tipo, projectId }: { tipo: 'dx' | 'st'; projectId: string }) {
  const { state, dispatch } = useAppState();
  const { company, team } = projectInfo(projectId);
  const ps = state.projects[projectId];
  const deliveryId = `${tipo}/${projectId}`;
  const grading = state.gradings[deliveryId];
  const [announcement, setAnnouncement] = useState('');
  const decisions = ps.diagnosis.decisions;
  const view = getDiagnosis(ps);
  const aiModel = view.mode === 'real' ? (ps.real?.diagnosisRun?.model ?? 'desconocido') : undefined;
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
          <p>{aiModel ? <AiBadge model={aiModel} /> : <SimBadge />}</p>
          {!aiModel && (
            <p>
              <strong>Índice de madurez: {formatDecimal(maturityOf(projectId))} de 5</strong> (ilustrativo, ficticio)
            </p>
          )}
          {aiModel && <MaturityPanel evaluation={evaluateMaturity(ps.real?.maturity, view.findings, decisions)} model={aiModel} />}
          {excluded > 0 && <p className="subtitle">{countOf(excluded, 'hallazgo excluido', 'hallazgos excluidos')} por el Consultor (no se muestran).</p>}
          <PillarGroups
            idPrefix="ent"
            findings={view.findings}
            filter={(f) => decisions[f.id]?.state !== 'rejected'}
            render={(f) => (
              <FindingCard key={f.id} finding={f} companyName={company.name} decision={decisions[f.id]} mode="readonly" issued {...(aiModel ? { aiModel } : {})} />
            )}
          />
        </section>
      ) : (
        <section aria-labelledby="entrega-st">
          <h2 id="entrega-st">Estrategia enviada</h2>
          <StrategyView derived={deriveStrategy(STRATEGY, view.findings, decisions)} />
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
