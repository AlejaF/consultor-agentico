import { countOf } from '../domain/format';
import type { Decision } from '../state/types';
import { reviewStats } from '../domain/visual';

/** Cifras de la revisión y una barra segmentada de su estado (AG-033). Solo lectura: no decide nada. */
export function ReviewStats({ findings, decisions }: { findings: readonly { id: string; verified: boolean }[]; decisions: Record<string, Decision> }) {
  const s = reviewStats(findings, decisions);
  const parts: { key: string; n: number; cls: string }[] = [
    { key: 'adopted', n: s.adopted, cls: 'rs-adopted' },
    { key: 'rejected', n: s.rejected, cls: 'rs-rejected' },
    { key: 'pending', n: s.pending, cls: 'rs-pending' },
  ];
  const label = `Estado de la revisión: ${countOf(s.adopted, 'aceptado o editado', 'aceptados o editados')}, ${countOf(s.rejected, 'rechazado', 'rechazados')}, ${countOf(s.pending, 'pendiente', 'pendientes')}`;
  const stat = (id: string, value: number, text: string) => (
    <div className="stat" data-testid={id}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{text}</span>
    </div>
  );
  return (
    <section className="review-stats" data-testid="review-stats" aria-label="Cifras de la revisión">
      <div className="stats-row">
        {stat('stat-total', s.total, 'Hallazgos')}
        {stat('stat-adopted', s.adopted, 'Aceptados o editados')}
        {stat('stat-rejected', s.rejected, 'Rechazados')}
        {stat('stat-pending', s.pending, 'Pendientes')}
        {stat('stat-unverified', s.unverified, 'NO VERIFICADO')}
      </div>
      <div className="rs-bar" role="img" aria-label={label}>
        {parts.map((p) => (p.n > 0 ? <span key={p.key} className={`rs-seg ${p.cls}`} style={{ width: `${(p.n / Math.max(1, s.total)) * 100}%` }} /> : null))}
      </div>
    </section>
  );
}
