import { TEAMS } from '../../data/teams';
import { countOf } from '../../domain/format';

/** Provisional (L1): lista de equipos. El tablero real se completa en L4. */
export function Dashboard() {
  return (
    <>
      <h1>Tablero</h1>
      <p>Equipos del programa (datos ficticios).</p>
      <ul className="cards" style={{ listStyle: 'none', padding: 0 }}>
        {TEAMS.map((t) => (
          <li key={t.id} className="card">
            <h2>{t.name}</h2>
            <p>{countOf(t.projectIds.length, 'proyecto', 'proyectos')}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
