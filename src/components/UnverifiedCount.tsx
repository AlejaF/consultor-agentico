import { getDiagnosis } from '../providers';
import { countUnverifiedAdopted, unverifiedAdoptedText } from '../domain/review';
import { useAppState } from '../state/context';

/** Cuántos hallazgos aceptados o editados están NO VERIFICADO en el proyecto de una entrega (FR-053). */
export function UnverifiedCount({ projectId }: { projectId: string }) {
  const { state } = useAppState();
  const n = countUnverifiedAdopted(getDiagnosis(state.projects[projectId]).findings, state.projects[projectId].diagnosis.decisions);
  return (
    <p className={n > 0 ? 'subtitle no-support' : 'subtitle'} data-testid="unverified-count">
      {unverifiedAdoptedText(n)}
    </p>
  );
}
