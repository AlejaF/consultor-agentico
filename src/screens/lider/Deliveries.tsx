import { deliveriesFor } from '../../domain/deliveries';
import { countOf } from '../../domain/format';
import { projectInfo } from '../../domain/lookup';
import { UnverifiedCount } from '../../components/UnverifiedCount';
import { useAppState } from '../../state/context';

/** Provisional (L3): lista de entregas por revisar. La revisión y la calificación se construyen en L4. */
export function Deliveries() {
  const { state } = useAppState();
  const pending = deliveriesFor(state).filter((d) => !d.graded);
  return (
    <>
      <h1>Entregas por revisar</h1>
      <p>{countOf(pending.length, 'entrega', 'entregas')} sin calificar. Todos los datos son ficticios.</p>
      <ul className="list-plain stack">
        {pending.map((d) => {
          const { company, team } = projectInfo(d.projectId);
          return (
            <li key={d.id} className="card">
              <p>
                <strong>{d.tipo === 'dx' ? 'Diagnóstico' : 'Estrategia'}</strong> · {company.name}
              </p>
              <p className="subtitle">{team.name}</p>
              <UnverifiedCount projectId={d.projectId} />
              <a className="btn" href={`#/lider/entregas/${d.tipo}/${d.projectId}`}>
                Abrir entrega<span className="visually-hidden"> de {company.name}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
