import { DIMENSIONS } from '../data/diagnosis';
import { averageBar, pillarAverages } from '../domain/visual';
import type { PersistedState } from '../state/types';
import { ScaleBar } from './ScaleBar';

/** Promedio de madurez por pilar (tablero del Líder): solo proyectos reales con diagnóstico emitido y niveles con respaldo vigente. Una sola escala 1–5 compartida. */
export function PillarAverages({ state }: { state: PersistedState }) {
  const rows = pillarAverages(state);
  return (
    <section className="card" aria-labelledby="tab-pilares" data-testid="pillar-averages">
      <h2 id="tab-pilares">Madurez por pilar (promedio)</h2>
      <p className="subtitle">Solo proyectos reales con diagnóstico emitido (estimado por IA). Los proyectos simulados no tienen nivel por pilar.</p>
      <div className="scale-axis" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      <ul className="list-plain maturity-list">
        {rows.map((r) => {
          const name = DIMENSIONS.find((d) => d.id === r.dimension)!.label;
          const view = averageBar(r.value, r.projects);
          return (
            <li key={r.dimension} className="maturity-row">
              <div className="row-head">
                <strong>{name}</strong>
                {view.kind === 'empty' && <span className="scale-label badge badge-blocked">{view.label}</span>}
              </div>
              <ScaleBar view={view} name={name} compact />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
