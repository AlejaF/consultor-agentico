import { useId, useState } from 'react';
import { modeOf } from '../providers';
import { UNAVAILABLE_TEXT } from '../providers/availability';
import { useAvailability } from '../providers/useAvailability';
import { useAppState } from '../state/context';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Selector «Simulado / IA real» (AG-001): el modo activo siempre se ve. El modo queda fijado por proyecto desde que se
 * genera el diagnóstico y no se mezcla (AG-029); la pantalla explica cómo cambiarlo.
 */
export function ModeSelector({ projectId }: { projectId: string }) {
  const { state, dispatch } = useAppState();
  const availability = useAvailability();
  const uid = useId();
  const [confirming, setConfirming] = useState(false);
  const ps = state.projects[projectId];
  const mode = modeOf(ps);
  const locked = ps.diagnosis.status !== 'none';
  const canClear = ps.diagnosis.status === 'generated' && ps.strategy.status === 'none';
  const realAvailable = availability.state === 'available';

  return (
    <section className="card mode-selector" aria-labelledby={`${uid}-t`} data-testid="mode-selector">
      <h2 id={`${uid}-t`}>Modo de análisis</h2>
      <p>
        Modo activo: <strong data-testid="active-mode">{mode === 'real' ? 'IA real' : 'Simulado'}</strong>
      </p>
      <div className="mode-options" role="group" aria-label="Elegir el modo de análisis de este proyecto">
        <button
          type="button"
          className="mode-option"
          aria-pressed={mode === 'simulated'}
          aria-disabled={locked || undefined}
          onClick={() => !locked && dispatch({ type: 'setMode', projectId, mode: 'simulated' })}
        >
          Simulado
        </button>
        <button
          type="button"
          className="mode-option"
          aria-pressed={mode === 'real'}
          aria-disabled={locked || (!realAvailable && mode !== 'real') || undefined}
          aria-describedby={!realAvailable ? `${uid}-aviso` : undefined}
          onClick={() => !locked && realAvailable && dispatch({ type: 'setMode', projectId, mode: 'real' })}
        >
          IA real
        </button>
      </div>
      <div role="status" aria-live="polite" id={`${uid}-aviso`}>
        {availability.state === 'checking' && <p className="subtitle">Comprobando si hay un servicio local…</p>}
        {availability.state === 'unavailable' && (
          <p className="subtitle" data-testid="real-unavailable">
            {UNAVAILABLE_TEXT}
          </p>
        )}
      </div>
      {locked && (
        <div data-testid="mode-locked">
          <p className="subtitle">
            El modo queda fijado porque este proyecto ya tiene diagnóstico: los hallazgos simulados y los reales no se mezclan. Para cambiarlo,
            limpia el diagnóstico{canClear ? '' : ' (solo es posible mientras no esté emitido, y sin estrategia)'} o trabaja en otro proyecto.
          </p>
          {canClear && (
            <button type="button" onClick={() => setConfirming(true)}>
              Limpiar diagnóstico
            </button>
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        title="¿Limpiar el diagnóstico?"
        confirmLabel="Sí, limpiar"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          dispatch({ type: 'clearDiagnosis', projectId });
        }}
      >
        <p>Se descartarán los hallazgos generados y tus decisiones sobre ellos, y podrás elegir otro modo. La evidencia cargada se conserva.</p>
      </ConfirmDialog>
    </section>
  );
}
