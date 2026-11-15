import { ReviewStatePanel } from './charts/Panels';
import type { Decision } from '../state/types';
import { reviewStats } from '../domain/visual';

/** Cifras de la revisión y una barra segmentada de su estado (AG-033). Solo lectura: no decide nada. */
export function ReviewStats({ findings, decisions }: { findings: readonly { id: string; verified: boolean }[]; decisions: Record<string, Decision> }) {
  const s = reviewStats(findings, decisions);
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
      <ReviewStatePanel findings={findings} decisions={decisions} />
    </section>
  );
}
