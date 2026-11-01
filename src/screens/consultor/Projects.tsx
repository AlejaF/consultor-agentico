import { COMPANIES } from '../../data/companies';
import { PROJECTS } from '../../data/projects';

/** Provisional (L1): lista simple de proyectos. La pantalla real se completa en L2. */
export function Projects() {
  const mine = PROJECTS.filter((p) => p.ownedByDemoConsultor);
  return (
    <>
      <h1>Proyectos</h1>
      <p>Proyectos del Equipo Demo Alfa (datos ficticios).</p>
      <ul className="cards" style={{ listStyle: 'none', padding: 0 }}>
        {mine.map((p) => (
          <li key={p.id} className="card">
            <h2>{COMPANIES.find((c) => c.id === p.companyId)?.name}</h2>
            <p>Proyecto {p.id}</p>
            <p className="subtitle">{p.lastActivityLabel}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
