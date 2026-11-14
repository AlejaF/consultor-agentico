import { DIAGNOSIS, DIMENSIONS, type Finding } from '../data/diagnosis';
import { pillarLabel } from './PillarGroups';

/** «Deriva de: [hallazgos]»: cada uno con su pilar, para no confundirlo con la etapa «Estrategia» (FR-025). */
export function DerivedFrom({ itemId, ids, findings = DIAGNOSIS.findings }: { itemId: string; ids: readonly string[]; findings?: readonly Finding[] }) {
  return (
    <p className="derived-from subtitle" data-testid={`derived-${itemId}`}>
      <strong>Deriva de:</strong>{' '}
      {ids.map((id, i) => {
        const f = findings.find((x) => x.id === id)!;
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
