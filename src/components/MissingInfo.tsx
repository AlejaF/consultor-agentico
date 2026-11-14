import { DIMENSIONS } from '../data/diagnosis';
import type { MissingInfo as Missing } from '../state/types';
import { AiBadge } from './AiBadge';
import { pillarLabel } from './PillarGroups';

/**
 * Información faltante por pilar (AG-021): lo que habría hecho falta para respaldar mejor el diagnóstico. Es solo texto de
 * salida rotulado como IA: no se acepta, rechaza ni edita, y no crea ningún flujo nuevo.
 */
export function MissingInfo({ items, model }: { items: readonly Missing[]; model: string }) {
  const byPillar = DIMENSIONS.map((d) => ({ d, items: items.filter((m) => m.dimension === d.id) })).filter((x) => x.items.length > 0);
  if (byPillar.length === 0) return null;
  return (
    <section className="card missing-info" aria-labelledby="falta-titulo" data-testid="missing-info">
      <h2 id="falta-titulo">Información que habría hecho falta</h2>
      <p>
        <AiBadge model={model} />
      </p>
      <dl>
        {byPillar.map(({ d, items: list }) => (
          <div key={d.id}>
            <dt>{pillarLabel(d.label)}</dt>
            {list.map((m, i) => (
              <dd key={i}>{m.description}</dd>
            ))}
          </div>
        ))}
      </dl>
    </section>
  );
}
