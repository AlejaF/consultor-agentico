import { useEffect, useRef, useState } from 'react';
import { createRealProvider, toRealState } from '../providers/real';
import { useAvailability } from '../providers/useAvailability';
import type { ServiceError } from '../providers/types';
import { useAppState } from '../state/context';
import type { TraceSummary } from '../state/types';
import { AiBadge } from './AiBadge';
import { TraceView } from './TraceView';

const RETRYABLE = new Set(['rate_limit', 'provider_unavailable', 'unreachable']);
const HINT: Record<string, string> = {
  spend_limit: 'No se reintentó. Sube el límite de gasto en tu cuenta de OpenAI o espera al próximo periodo.',
  balance: 'No se reintentó. Agrega crédito a tu cuenta de OpenAI.',
  auth: 'No se reintentó. Revisa la clave en el archivo del servicio local (server/.env).',
  usage_limit: 'No se reintentó. Es un límite de uso fijado por OpenAI.',
  rate_limit: 'Hay demasiadas solicitudes. Puedes reintentar a mano en unos segundos.',
  no_model_configured: 'Define el modelo de esta etapa en el servicio local y vuelve a intentarlo.',
  invalid_request: 'No se reintentó: reintentar no lo arregla.',
  model_unavailable: 'No se reintentó: revisa el nombre del modelo y que tu proyecto tenga acceso.',
  access_denied: 'No se reintentó: OpenAI negó el acceso.',
};

/** Ejecuta el agente real y guarda el resultado (AG-009, AG-011): errores por categoría, sin reintento automático. */
export function RealGenerate({ projectId, companyName }: { projectId: string; companyName: string }) {
  const { state, dispatch } = useAppState();
  const availability = useAvailability();
  const ps = state.projects[projectId];
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  const started = useRef(false);
  useEffect(() => () => ctrl.current?.abort(), []); // salir de la pantalla cierra la conexión: el servicio descarta la corrida

  const files = ps.serverFiles ?? [];
  const health = availability.state === 'available' ? availability.health : null;
  let blocked: string | null = null;
  if (availability.state === 'unavailable') blocked = 'IA real no disponible aquí (requiere ejecutar el backend en tu equipo).';
  else if (health && !health.fake && !health.keyConfigured) blocked = 'Falta la clave de OpenAI en el servicio local.';
  else if (health && !health.models.diagnosis) blocked = 'Falta configurar el modelo del diagnóstico en el servicio local (OPENAI_MODEL_DIAGNOSTICO).';
  else if (files.length === 0) blocked = 'Carga al menos un archivo en la captura de evidencia para poder generar el diagnóstico.';

  async function run() {
    if (started.current || blocked) return;
    started.current = true;
    setRunning(true);
    setError(null);
    const startedAt = new Date().toISOString();
    ctrl.current = new AbortController();
    try {
      const r = await createRealProvider().runDiagnosis(projectId, companyName, ctrl.current.signal);
      if (r.ok) dispatch({ type: 'generateReal', projectId, at: new Date().toISOString(), real: toRealState(r.value, startedAt, new Date().toISOString()) });
      else setError(r.error);
    } catch {
      /* cierre de la pantalla: sin resultado a medias */
    } finally {
      started.current = false;
      setRunning(false);
    }
  }

  const errorRun: Pick<TraceSummary, 'steps'> | null = error?.trace ? { steps: error.trace } : null;
  return (
    <section className="card" aria-labelledby="gen-real-titulo">
      <h2 id="gen-real-titulo">Generar diagnóstico con IA real</h2>
      <p>El agente busca en los documentos que cargaste, propone hallazgos con citas literales y un proceso determinista verifica cada cita.</p>
      <button type="button" className="primary" aria-disabled={running || blocked !== null} aria-busy={running} aria-describedby="gen-real-estado" onClick={() => void run()}>
        Generar diagnóstico
      </button>
      {running && (
        <button type="button" onClick={() => ctrl.current?.abort()}>
          Cancelar
        </button>
      )}
      <div id="gen-real-estado" role="status" aria-live="polite" className="generating">
        {blocked && <p data-testid="real-blocked">{blocked}</p>}
        {running && (
          <p>
            Ejecutando el agente; puede tardar un minuto… {availability.state === 'available' && health?.models.diagnosis && <AiBadge model={health.models.diagnosis} />}
          </p>
        )}
      </div>
      {error && (
        <div role="alert" className="field-error-box" data-testid="real-error" data-category={error.category}>
          <p>
            <strong>{error.message}</strong>
            {error.providerCode ? ` (código ${error.providerCode})` : ''}
          </p>
          {HINT[error.category] && <p>{HINT[error.category]}</p>}
          {RETRYABLE.has(error.category) && (
            <button type="button" onClick={() => void run()}>
              Reintentar
            </button>
          )}
          {errorRun && <TraceView run={errorRun} />}
        </div>
      )}
    </section>
  );
}
