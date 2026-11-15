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

export const label = (dim: string) => DIMENSIONS.find((d) => d.id === dim)?.label ?? dim;

/** Etiqueta de estado de la fila: se dice UNA vez (AG-034). Las dimensiones con nivel respaldado no la llevan. */
export function RowState({ l }: { l: LevelView }) {
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

/**
 * UN solo desplegable para todo el bloque (AG-035): justificación completa y «Deriva de» (o la explicación del estado) de cada dimensión.
 * No repite la línea corta. Abierto en el informe imprimible; el CSS de impresión también lo muestra.
 */
function MaturityDetail({ levels, open }: { levels: LevelView[]; open: boolean }) {
  return (
    <details className="maturity-detail row-detail" data-testid="maturity-detail" {...(open ? { open: true } : {})}>
      <summary>Justificación y respaldo de cada dimensión</summary>
      <dl>
        {levels.map((l) => (
          <div key={l.dimension} data-testid={`maturity-detail-${l.dimension}`}>
            <dt>{label(l.dimension)}</dt>
            <dd>
              {l.status === 'insufficient' && <>No hay hallazgos verificados en esta dimensión; no entra en el índice.</>}
              {l.status === 'no-backing' && (l.reason === 'rejected' ? 'Todos sus hallazgos fueron rechazados; no entra en el índice.' : 'Sus hallazgos aún no están aceptados o editados; no entra en el índice.')}
              {l.status === 'backed' && (
                <>
                  <strong>Nivel {l.level} de 5</strong> · {basedOnText(l.basedOn)}. {l.justification} <span className="subtitle">Deriva de: {l.backing.join(', ')}</span>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
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
                </div>
                <ScaleBar view={levelBar(l)} name={label(l.dimension)} compact />
                <div className="row-state">
                  <RowState l={l} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <MaturityDetail levels={evaluation.levels} open={openDetails} />
    </section>
  );
}
