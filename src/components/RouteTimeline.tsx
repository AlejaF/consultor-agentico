import type { Finding } from '../data/diagnosis';
import type { DerivedItem } from '../domain/strategy';
import { DerivedFrom } from './DerivedFrom';

/** Ruta sugerida por fases, con su horizonte. */
export function RouteTimeline({ items, findings }: { items: readonly DerivedItem[]; findings?: readonly Finding[] }) {
  return (
    <ol className="timeline timeline-line list-plain">
      {items.map((it, i) => (
        <li key={it.id} className="card" data-testid={`phase-${it.id}`}>
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
