import { GradeSummary } from './GradeSummary';
import { useAppState } from '../state/context';

/** Estado de una entrega vista por el Consultor: «Por revisar» o la calificación guardada, sin poder modificarla (FR-032). */
export function DeliveryStatus({ deliveryId, label }: { deliveryId: string; label: string }) {
  const { state } = useAppState();
  const grading = state.gradings[deliveryId];
  if (grading) return <GradeSummary grading={grading} title={`Calificación de ${label}`} />;
  return (
    <p>
      <span className="badge badge-pending">Por revisar</span> <span className="subtitle">En la cola del Líder. Su calificación aparecerá aquí cuando la guarde.</span>
    </p>
  );
}
