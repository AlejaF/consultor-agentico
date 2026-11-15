import { formatDecimal } from '../domain/format';
import { SCALE_MAX, segmentFills } from '../domain/visual';

/**
 * Nivel general «N de 5» con una barra de 5 segmentos (AG-033). Rotula «estimado por IA» (real) o «ilustrativo, ficticio» (simulado).
 * Sin índice: «—» y «Sin evidencia suficiente». Los niveles no tienen nombre en los datos: solo el número.
 */
export function MaturityIndexCard({ index, mode }: { index: number | null; mode: 'real' | 'simulated' }) {
  const value = index === null ? '—' : `${formatDecimal(index)} de ${SCALE_MAX}`;
  return (
    <div className="index-card" data-testid="maturity-card">
      <p className="index-kicker">Nivel general</p>
      <p className="index-value" data-testid="maturity-card-value">
        {value}
      </p>
      <div className="seg-row" role="img" aria-label={index === null ? 'Nivel general: sin evidencia suficiente' : `Nivel general: ${value}`}>
        {segmentFills(index).map((f, i) => (
          <span key={i} className="segment">
            {f > 0 && <span className="seg-fill" style={{ width: `${f * 100}%` }} />}
          </span>
        ))}
      </div>
      <p className="subtitle" data-testid="maturity-card-label">
        {index === null ? 'Sin evidencia suficiente' : mode === 'real' ? 'estimado por IA' : 'ilustrativo, ficticio'}
      </p>
    </div>
  );
}
