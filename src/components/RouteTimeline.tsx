import type { Finding } from '../data/diagnosis';
import type { DerivedItem } from '../domain/strategy';
import { groupByHorizon } from '../domain/charts';
import { DerivedFrom } from './DerivedFrom';

/** Ruta sugerida por fases, con su horizonte. */
export function RouteTimeline({ items, findings }: { items: readonly DerivedItem[]; findings?: readonly Finding[] }) {
  // Columnas por horizonte (desde 1024 px, AG-035): el orden del marcado no cambia; solo la columna de cada fase.
  const groups = groupByHorizon(items);
  const colOf = (it: DerivedItem) => groups.findIndex((g) => g.items.includes(it)) + 1;
  const byHorizon = groups.length > 1;
  return (
    <ol className={`timeline timeline-line list-plain${byHorizon ? ' by-horizon' : ''}`} {...(byHorizon ? { style: { ['--cols' as string]: groups.length } } : {})}>
      {items.map((it, i) => (
        <li key={it.id} className="card" data-testid={`phase-${it.id}`} {...(byHorizon ? { style: { ['--col' as string]: colOf(it) } } : {})}>
          <h3>
            Fase {i + 1}: {it.label}
          </h3>
          {it.horizon && (
            <p>
              <span className="badge badge-pending chip-horizon">Horizonte: {it.horizon}</span>
            </p>
          )}
          <p>{it.detail}</p>
          <DerivedFrom itemId={it.id} ids={it.derivedFrom} {...(findings ? { findings } : {})} />
        </li>
      ))}
    </ol>
  );
}
