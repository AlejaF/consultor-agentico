import { DIMENSIONS } from '../data/diagnosis';
import { averageBar, pillarAverages } from '../domain/visual';
import type { PersistedState } from '../state/types';
import { ScaleBar } from './ScaleBar';

/** Promedio de madurez por pilar (tablero del Líder): solo proyectos reales con diagnóstico emitido y niveles con respaldo vigente. */
export function PillarAverages({ state }: { state: PersistedState }) {
  const rows = pillarAverages(state);
  return (
    <section className="card" aria-labelledby="tab-pilares" data-testid="pillar-averages">
      <h2 id="tab-pilares">Madurez por pilar (promedio)</h2>
      <p className="subtitle">Solo proyectos reales con diagnóstico emitido (estimado por IA). Los proyectos simulados no tienen nivel por pilar.</p>
      <ul className="list-plain stack">
        {rows.map((r) => {
          const name = DIMENSIONS.find((d) => d.id === r.dimension)!.label;
          return (
            <li key={r.dimension}>
              <strong>{name}</strong>
              <ScaleBar view={averageBar(r.value, r.projects)} name={name} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
