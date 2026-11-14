import { DIMENSIONS } from '../data/diagnosis';
import { formatDecimal } from '../domain/format';
import { MATURITY_INDEX_LABEL, basedOnText, type LevelView, type MaturityEvaluation } from '../domain/maturity';
import { AiBadge } from './AiBadge';
import { UnverifiedBadge } from './badges';

/** Índice de madurez de un proyecto en modo IA real (AG-031): calculado por código, nunca «(ilustrativo, ficticio)». */
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

function LevelBody({ l, model }: { l: LevelView; model: string }) {
  if (l.status === 'insufficient') {
    return (
      <>
        <strong>{label(l.dimension)}</strong>: Sin evidencia suficiente <UnverifiedBadge />
        <span className="subtitle"> No hay hallazgos verificados en esta dimensión; no entra en el índice.</span>
      </>
    );
  }
  if (l.status === 'no-backing') {
    return (
      <>
        <strong>{label(l.dimension)}</strong>: Sin respaldo vigente{' '}
        <span className="subtitle">
          {l.reason === 'rejected' ? 'Todos sus hallazgos fueron rechazados; no entra en el índice.' : 'Sus hallazgos aún no están aceptados o editados; no entra en el índice.'}
        </span>
      </>
    );
  }
  return (
    <>
      <strong>{label(l.dimension)}</strong>: Nivel {l.level} de 5 · {basedOnText(l.basedOn)} <AiBadge model={model} />
      <br />
      <span>{l.justification}</span>
      <br />
      <span className="subtitle">Deriva de: {l.backing.join(', ')}</span>
    </>
  );
}

/**
 * Madurez por dimensión de un diagnóstico real (AG-031). Solo lectura: los niveles NO se aceptan ni se rechazan; cuentan según
 * las decisiones sobre los hallazgos de los que derivan, y el índice se recalcula por código.
 */
export function MaturityPanel({ evaluation, model }: { evaluation: MaturityEvaluation; model: string }) {
  return (
    <section className="card maturity-panel" aria-labelledby="madurez-titulo" data-testid="maturity-panel">
      <h2 id="madurez-titulo">Madurez por dimensión</h2>
      <MaturityIndexReal index={evaluation.index} />
      <ul className="list-plain stack">
        {evaluation.levels.map((l) => (
          <li key={l.dimension} data-testid={`maturity-level-${l.dimension}`}>
            <LevelBody l={l} model={model} />
          </li>
        ))}
      </ul>
    </section>
  );
}
