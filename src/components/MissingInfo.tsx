import { DIMENSIONS } from '../data/diagnosis';
import type { MissingInfo as Missing } from '../state/types';
import { AiBadge } from './AiBadge';
import { pillarLabel } from './PillarGroups';

/**
 * Evidencia sugerida por pilar (AG-021): lo que la IA sugiere reunir para fortalecer el diagnóstico. Es solo texto de
 * salida rotulado como IA: no se acepta, rechaza ni edita, y no crea ningún flujo nuevo.
 */
export function MissingInfo({ items }: { items: readonly Missing[] }) {
  const byPillar = DIMENSIONS.map((d) => ({ d, items: items.filter((m) => m.dimension === d.id) })).filter((x) => x.items.length > 0);
  if (byPillar.length === 0) return null;
  return (
    <section className="card missing-info" aria-labelledby="falta-titulo" data-testid="missing-info">
      <h2 id="falta-titulo">Evidencia sugerida para fortalecer el diagnóstico</h2>
      <p>
        <AiBadge />
      </p>
      <p>Son sugerencias de la IA, no hallazgos ni contenido verificado.</p>
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
