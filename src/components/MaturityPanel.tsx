import { DIMENSIONS } from '../data/diagnosis';
import { formatDecimal } from '../domain/format';
import { MATURITY_INDEX_LABEL, basedOnText, type LevelView, type MaturityEvaluation } from '../domain/maturity';
import { levelBar } from '../domain/visual';
import { AiBadge } from './AiBadge';
import { UnverifiedBadge } from './badges';
import { MaturityIndexCard } from './MaturityIndexCard';
import { ScaleBar } from './ScaleBar';

/** Índice de madurez de un proyecto en modo IA real (AG-031): calculado por código, nunca «(ilustrativo, ficticio)». Se conserva para el informe sin evaluación. */
export function MaturityIndexReal({ index }: { index: number | null }) {
  return (
    <p data-testid="maturity-index">
      <strong>Índice de madurez: {index === null ? '—' : `${formatDecimal(index)} de 5`}</strong>{' '}
      <span data-testid="maturity-index-label" className="subtitle">
        {MATURITY_INDEX_LABEL}
      </span>
    </p>
  );
}

const label = (dim: string) => DIMENSIONS.find((d) => d.id === dim)?.label ?? dim;

/** Etiqueta de estado de la fila: se dice UNA vez (AG-034). Las dimensiones con nivel respaldado no la llevan. */
function RowState({ l }: { l: LevelView }) {
  if (l.status === 'insufficient') {
    return (
      <>
        <span className="scale-label badge badge-blocked">Sin evidencia suficiente</span> <UnverifiedBadge />
      </>
    );
  }
  if (l.status === 'no-backing') return <span className="scale-label badge badge-blocked">Sin respaldo vigente</span>;
  return null;
}

/** Primera frase de la justificación, de hasta 90 caracteres: la línea corta que queda visible sin abrir nada. */
export function shortJustification(text: string): string {
  const first = text.trim().split(/(?<=[.!?])\s/)[0] ?? '';
  return first.length <= 90 ? first : `${first.slice(0, 87).trimEnd()}…`;
}

/** Línea corta de justificación y chips con los ids de los que deriva: siempre visibles (AG-034). */
function RowSummary({ l }: { l: LevelView }) {
  if (l.status !== 'backed') return null;
  return (
    <div className="row-summary">
      <p className="row-just">{shortJustification(l.justification)}</p>
      <p className="row-chips" aria-label="Deriva de">
        {l.backing.map((id) => (
          <span key={id} className="badge chip-id">
            {id}
          </span>
        ))}
      </p>
    </div>
  );
}

/** Detalle desplegable: texto completo y «Deriva de» (o la explicación del estado). Abierto en el informe imprimible; el CSS de impresión también lo muestra. */
function RowDetail({ l, open }: { l: LevelView; open: boolean }) {
  return (
    <details className="row-detail" {...(open ? { open: true } : {})}>
      <summary>Justificación y respaldo</summary>
      {l.status === 'insufficient' && <p className="subtitle">No hay hallazgos verificados en esta dimensión; no entra en el índice.</p>}
      {l.status === 'no-backing' && (
        <p className="subtitle">{l.reason === 'rejected' ? 'Todos sus hallazgos fueron rechazados; no entra en el índice.' : 'Sus hallazgos aún no están aceptados o editados; no entra en el índice.'}</p>
      )}
      {l.status === 'backed' && (
        <>
          <p>
            <strong>Nivel {l.level} de 5</strong> · {basedOnText(l.basedOn)}
          </p>
          <p>{l.justification}</p>
          <p className="subtitle">Deriva de: {l.backing.join(', ')}</p>
        </>
      )}
    </details>
  );
}

/**
 * Madurez por dimensión de un diagnóstico real (AG-031, AG-034). Solo lectura: los niveles NO se aceptan ni se rechazan; cuentan según
 * las decisiones sobre los hallazgos de los que derivan, y el índice se recalcula por código. Composición: a la izquierda la tarjeta del
 * nivel general; a la derecha una lista compacta de 6 barras con una sola escala 1–5. El rótulo de IA (principio III, AG-023) va unido
 * al encabezado del bloque, una sola vez.
 */
export function MaturityPanel({ evaluation, openDetails = false }: { evaluation: MaturityEvaluation; openDetails?: boolean }) {
  const backing = new Set(evaluation.levels.flatMap((l) => (l.status === 'backed' ? l.backing : [])));
  return (
    <section className="card maturity-panel" aria-labelledby="madurez-titulo" data-testid="maturity-panel">
      <div className="block-head">
        <h2 id="madurez-titulo">Madurez por dimensión</h2>
        <AiBadge />
      </div>
      <div className="maturity-layout">
        <MaturityIndexCard index={evaluation.index} mode="real" basedOn={backing.size} />
        <div className="maturity-bars">
          <div className="scale-axis" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
          <ul className="list-plain maturity-list">
            {evaluation.levels.map((l) => (
              <li key={l.dimension} className="maturity-row" data-testid={`maturity-level-${l.dimension}`}>
                <div className="row-head">
                  <strong>{label(l.dimension)}</strong>
                  <RowState l={l} />
                </div>
                <ScaleBar view={levelBar(l)} name={label(l.dimension)} compact />
                <RowSummary l={l} />
                <RowDetail l={l} open={openDetails} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
