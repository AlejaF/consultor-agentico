import { COMPANY_PROJECT_ID, SAMPLE_ACTIVITY } from '../../data/survey';
import { buildEvidenceItems } from '../../domain/evidence';
import { adoptionSteps, nextStep } from '../../domain/company';
import { formatDateTime, formatDecimal } from '../../domain/format';
import { maturityOf } from '../../domain/maturity';

import { projectInfo } from '../../domain/lookup';
import { StatusBadge } from '../../components/badges';
import { useAppState } from '../../state/context';

const BADGE = { Pendiente: 'pendiente', 'En curso': 'en-curso', Completado: 'completado' } as const;

/** Inicio de la Empresa: ruta de adopción, próximo paso y actividad de ejemplo de su propio proyecto (FR-034). */
export function Summary() {
  const { state } = useAppState();
  const { project, company } = projectInfo(COMPANY_PROJECT_ID);
  const ps = state.projects[COMPANY_PROJECT_ID];
  const steps = adoptionSteps({
    evidenceCount: buildEvidenceItems(project, company.name, ps.localFiles).length,
    diagnosis: ps.diagnosis.status,
    strategy: ps.strategy.status,
  });
  const issued = ps.diagnosis.status === 'issued';
  const surveyDone = state.surveys[COMPANY_PROJECT_ID] !== undefined;
  return (
    <>
      <h1>Empresa</h1>
      <p>
        {company.name} · Proyecto {COMPANY_PROJECT_ID}
      </p>

      {issued && (
        <p data-testid="madurez-empresa">
          <strong>Índice de madurez: {formatDecimal(maturityOf(COMPANY_PROJECT_ID))} de 5</strong> (ilustrativo, ficticio)
        </p>
      )}

      <section className="card" aria-labelledby="ruta-adopcion">
        <h2 id="ruta-adopcion">Ruta de adopción</h2>
        <ol className="list-plain stack">
          {steps.map((s, i) => (
            <li key={s.id} data-testid={`paso-${s.id}`}>
              <strong>
                Paso {i + 1}: {s.label}
              </strong>{' '}
              <StatusBadge status={BADGE[s.status]} />
            </li>
          ))}
        </ol>
        <p data-testid="proximo-paso">
          <strong>Próximo paso:</strong> {nextStep(steps, surveyDone)}
        </p>
      </section>

      <section className="card" aria-labelledby="informe-empresa">
        <h2 id="informe-empresa">Informe de diagnóstico</h2>
        {issued ? (
          <p>
            <a className="btn primary" href="#/contacto/informe">
              Ver informe de diagnóstico
            </a>
          </p>
        ) : (
          <p>El informe estará disponible cuando el equipo de consultoría emita el diagnóstico.</p>
        )}
        <p>
          <a className="btn" href="#/contacto/encuesta">
            {surveyDone ? 'Ver mis respuestas de la encuesta' : 'Responder la encuesta'}
          </a>
        </p>
      </section>

      <section className="card" aria-labelledby="actividad-reciente">
        <h2 id="actividad-reciente">Actividad reciente</h2>
        <p>
          <span className="badge badge-pending">Actividad de ejemplo (ficticia)</span>
        </p>
        <ul className="list-plain stack">
          {SAMPLE_ACTIVITY.map((a) => (
            <li key={a.at}>
              <span className="subtitle">{formatDateTime(a.at)}</span> · {a.text}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
