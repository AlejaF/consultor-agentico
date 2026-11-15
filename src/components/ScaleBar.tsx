import { LOW_LABEL, SCALE_MAX, type BarView } from '../domain/visual';

/**
 * Barra horizontal de la escala 1 a 5, con marca en 2 (AG-033). CSS propio, sin librerías. El color nunca es el único dato:
 * lleva el valor o la etiqueta en texto. Una barra vacía («Sin evidencia suficiente» / «Sin respaldo vigente») es rayada y NUNCA lleva número.
 */
export function ScaleBar({ view, name }: { view: BarView; name: string }) {
  if (view.kind === 'empty') {
    return (
      <div className="scale-bar" role="img" aria-label={`${name}: ${view.label}, ${view.basedText}`}>
        <div className="scale-track scale-empty" />
        <p className="scale-text" aria-hidden="true">
          <span className="badge badge-blocked">{view.label}</span> <span className="scale-based">{view.basedText}</span>
        </p>
      </div>
    );
  }
  return (
    <div className="scale-bar" role="img" aria-label={`${name}: ${view.word} ${view.valueText}, ${view.basedText}${view.low ? `, ${LOW_LABEL}` : ''}`}>
      <div className="scale-track">
        <div className={view.low ? 'scale-fill scale-fill-low' : 'scale-fill'} style={{ width: `${view.percent}%` }} />
        <span className="scale-mark" style={{ left: `${(2 / SCALE_MAX) * 100}%` }} />
      </div>
      <p className="scale-ticks" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </p>
      <p className="scale-text" aria-hidden="true">
        <strong>{view.valueText}</strong>
        {view.low && <> <span className="badge badge-danger">{LOW_LABEL}</span></>} <span className="scale-based">· {view.basedText}</span>
      </p>
    </div>
  );
}
