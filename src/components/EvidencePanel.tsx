import type { ResolvedCitation } from '../domain/evidence';

interface Props {
  citations: readonly ResolvedCitation[];
  idFor: (excerptId: string) => string;
}

/** Extractos ficticios de las citas abiertas. Toda cita lleva el rótulo «Evidencia de ejemplo (ficticia)» (FR-017). */
export function EvidencePanel({ citations, idFor }: Props) {
  if (citations.length === 0) return null;
  return (
    <div className="evidence-panel">
      {citations.map((c) => (
        <section key={c.excerptId} id={idFor(c.excerptId)} aria-label={`Extracto: ${c.label}`}>
          <p>
            <span className="badge badge-sim">Evidencia de ejemplo (ficticia)</span>
          </p>
          <blockquote>
            <p>«{c.text}»</p>
            <footer>{c.label}</footer>
          </blockquote>
        </section>
      ))}
    </div>
  );
}
