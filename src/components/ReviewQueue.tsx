import type { Delivery } from '../domain/deliveries';
import { projectInfo } from '../domain/lookup';
import { UnverifiedCount } from './UnverifiedCount';

/** Cola de entregas por revisar. */
export function ReviewQueue({ deliveries }: { deliveries: readonly Delivery[] }) {
  if (deliveries.length === 0) return <p data-testid="review-queue">No hay entregas por revisar.</p>;
  return (
    <ul className="list-plain stack" data-testid="review-queue">
      {deliveries.map((d) => {
        const { company, team } = projectInfo(d.projectId);
        const kind = d.tipo === 'dx' ? 'Diagnóstico' : 'Estrategia';
        return (
          <li key={d.id} className="card queue-item">
            <div>
              <p>
                <strong>{kind}</strong> · {company.name}
              </p>
              <p className="subtitle">{team.name}</p>
              <UnverifiedCount projectId={d.projectId} />
            </div>
            <a className="btn" href={`#/lider/entregas/${d.tipo}/${d.projectId}`}>
              Revisar<span className="visually-hidden"> {kind.toLowerCase()} de {company.name}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
