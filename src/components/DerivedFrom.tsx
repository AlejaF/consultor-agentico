import { DIAGNOSIS, DIMENSIONS } from '../data/diagnosis';
import { pillarLabel } from './PillarGroups';

/** «Deriva de: [hallazgos]»: cada uno con su pilar, para no confundirlo con la etapa «Estrategia» (FR-025). */
export function DerivedFrom({ itemId, ids }: { itemId: string; ids: readonly string[] }) {
  return (
    <p className="derived-from subtitle" data-testid={`derived-${itemId}`}>
      <strong>Deriva de:</strong>{' '}
      {ids.map((id, i) => {
        const f = DIAGNOSIS.findings.find((x) => x.id === id)!;
        const pillar = DIMENSIONS.find((d) => d.id === f.dimension)!.label;
        return (
          <span key={id} className="derived-item">
            {id} · {f.title} ({pillarLabel(pillar)}){i < ids.length - 1 ? ';' : ''}{' '}
          </span>
        );
      })}
    </p>
  );
}
