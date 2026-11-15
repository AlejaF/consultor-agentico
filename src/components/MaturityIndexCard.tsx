import { formatDecimal } from '../domain/format';
import { MATURITY_INDEX_LABEL } from '../domain/maturity';
import { SCALE_MAX, segmentFills } from '../domain/visual';

/**
 * Nivel general «N de 5» con una barra de 5 segmentos (AG-033, AG-034). Rotula «estimado por IA» (real) o «ilustrativo, ficticio» (simulado).
 * Sin índice: «—» y «Sin evidencia suficiente». Los niveles no tienen nombre en los datos: solo el número.
 * En modo real es la pieza principal del bloque de madurez y lleva el índice UNA sola vez (con «basado en N hallazgos aceptados»).
 */
export function MaturityIndexCard({ index, mode, basedOn }: { index: number | null; mode: 'real' | 'simulated'; basedOn?: number }) {
  const value = index === null ? '—' : `${formatDecimal(index)} de ${SCALE_MAX}`;
  const real = mode === 'real';
  const segments = (
    <div className="seg-row" role="img" aria-label={index === null ? 'Nivel general: sin evidencia suficiente' : `Nivel general: ${value}`}>
      {segmentFills(index).map((f, i) => (
        <span key={i} className="segment">
          {f > 0 && <span className="seg-fill" style={{ width: `${f * 100}%` }} />}
        </span>
      ))}
    </div>
  );
  const label = index === null ? 'Sin evidencia suficiente' : real ? 'estimado por IA' : 'ilustrativo, ficticio';
  return (
    <div className={real ? 'index-card index-card-solid' : 'index-card'} data-testid="maturity-card">
      {real ? (
        <div data-testid="maturity-index">
          <p className="index-kicker">Índice de madurez:</p>{' '}
          <p className="index-value" data-testid="maturity-card-value">
            {value}
          </p>
        </div>
      ) : (
        <>
          <p className="index-kicker">Nivel general</p>
          <p className="index-value" data-testid="maturity-card-value">
            {value}
          </p>
        </>
      )}
      {segments}
      <p className="index-label" data-testid="maturity-card-label">
        {label}
      </p>
      {real && index !== null && basedOn !== undefined && basedOn > 0 && (
        <p className="index-based">{basedOn === 1 ? 'basado en 1 hallazgo aceptado' : `basado en ${basedOn} hallazgos aceptados`}</p>
      )}
      {real && (
        <p className="index-note" data-testid="maturity-index-label">
          {MATURITY_INDEX_LABEL}
        </p>
      )}
    </div>
  );
}
