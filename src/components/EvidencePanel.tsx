import type { ResolvedCitation } from '../domain/evidence';

interface Props {
  citations: readonly ResolvedCitation[];
  idFor: (excerptId: string) => string;
}

/** Extractos de las citas abiertas. La evidencia de ejemplo lleva «Evidencia de ejemplo (ficticia)» (FR-017); la real, «Extracto de tu archivo» (AG-024). */
export function EvidencePanel({ citations, idFor }: Props) {
  if (citations.length === 0) return null;
  return (
    <div className="evidence-panel">
      {citations.map((c) => (
        <section key={c.excerptId} id={idFor(c.excerptId)} aria-label={`Extracto: ${c.label}`}>
          <p>
            {c.real ? (
              <>
                <span className="badge badge-ai">Extracto de tu archivo</span>{' '}
                <span className={c.real.verified ? 'badge badge-ok' : 'badge badge-unverified'}>{c.real.verified ? 'Cita verificada' : 'Cita NO verificada'}</span>
              </>
            ) : (
              <span className="badge badge-sim">Evidencia de ejemplo (ficticia)</span>
            )}
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
