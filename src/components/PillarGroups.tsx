import type { ReactNode } from 'react';
import { DIAGNOSIS, DIMENSIONS, type Finding } from '../data/diagnosis';

/** Rotulo de un grupo de hallazgos: «Pilar: <nombre>» (FR-016), para no confundirlo con la etapa «Estrategia». */
export function pillarLabel(label: string): string {
  return `Pilar: ${label}`;
}

/** Hallazgos agrupados por pilar, cada grupo con su encabezado de nivel 2. */
export function PillarGroups({ idPrefix, render, filter, findings: source = DIAGNOSIS.findings }: { idPrefix: string; render: (f: Finding) => ReactNode; filter?: (f: Finding) => boolean; findings?: readonly Finding[] }) {
  return (
    <>
      {DIMENSIONS.map((dim) => {
        const findings = source.filter((f) => f.dimension === dim.id && (!filter || filter(f)));
        if (findings.length === 0) return null;
        return (
          <section key={dim.id} aria-labelledby={`${idPrefix}-${dim.id}`}>
            <h2 id={`${idPrefix}-${dim.id}`}>{pillarLabel(dim.label)}</h2>
            <div className="stack">{findings.map((f) => render(f))}</div>
          </section>
        );
      })}
    </>
  );
}
