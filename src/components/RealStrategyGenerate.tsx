import { useEffect, useRef, useState } from 'react';
import { buildStrategyRequest, strategyBackedFindings } from '../domain/realStrategy';
import { createRealProvider, toRealStrategy } from '../providers/real';
import type { ServiceError } from '../providers/types';
import { useAvailability } from '../providers/useAvailability';
import { useAppState } from '../state/context';
import { HINT, RETRYABLE } from './RealGenerate';
import { TraceView } from './TraceView';

/**
 * Genera la estrategia con el agente real (AG-019, AG-020). Solo se ofrece con al menos un hallazgo aceptado o editado y verificado;
 * sin ninguno se explica y NO se llama al servicio ni al modelo. Si falla, el proyecto NO cae al modo Simulado en silencio (AG-029):
 * se dice «Estrategia real no disponible» y los errores de gasto, saldo, clave o uso no se reintentan.
 */
export function RealStrategyGenerate({ projectId, companyName }: { projectId: string; companyName: string }) {
  const { state, dispatch } = useAppState();
  const availability = useAvailability();
  const ps = state.projects[projectId];
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  const started = useRef(false);
  useEffect(() => () => ctrl.current?.abort(), []);

  const findings = ps.real?.findings ?? [];
  const decisions = ps.diagnosis.decisions;
  const backed = strategyBackedFindings(findings, decisions);

  if (backed.length === 0) {
    return (
      <section className="card" aria-labelledby="estrategia-sin-respaldo" data-testid="strategy-real-nobacking">
        <h2 id="estrategia-sin-respaldo">Todavía no hay con qué generar la estrategia</h2>
        <p>
          La estrategia con IA real se genera solo a partir de hallazgos aceptados o editados y verificados, y este diagnóstico no tiene ninguno. No se llamó a la
          IA. Puedes ver el informe del diagnóstico.
        </p>
        <p>
          <a className="btn" href={`#/consultor/proyectos/${projectId}/informe`}>
            Ver informe imprimible
          </a>
        </p>
      </section>
    );
  }

  const health = availability.state === 'available' ? availability.health : null;
  let blocked: string | null = null;
  if (availability.state === 'unavailable') blocked = 'IA real no disponible aquí (requiere ejecutar el backend en tu equipo).';
  else if (health && !health.fake && !health.keyConfigured) blocked = 'Falta la clave de OpenAI en el servicio local.';
  else if (health && !health.models.strategy) blocked = 'Falta configurar el modelo de la estrategia en el servicio local (OPENAI_MODEL_ESTRATEGIA).';

  async function run() {
    if (started.current || blocked) return;
    started.current = true;
    setRunning(true);
    setError(null);
    const startedAt = new Date().toISOString();
    ctrl.current = new AbortController();
    try {
      const r = await createRealProvider().runStrategy(buildStrategyRequest(projectId, companyName, findings, decisions), ctrl.current.signal);
      if (r.ok) dispatch({ type: 'generateStrategy', projectId, at: new Date().toISOString(), real: toRealStrategy(r.value, findings, decisions, startedAt, new Date().toISOString()) });
      else setError(r.error);
    } catch {
      /* cierre de la pantalla: sin resultado a medias */
    } finally {
      started.current = false;
      setRunning(false);
    }
  }

  return (
    <section className="card" aria-labelledby="estrategia-generar-real">
      <h2 id="estrategia-generar-real">Generar estrategia con IA real</h2>
      <p>
        El agente propone riesgos y una ruta a partir de los {backed.length} hallazgos aceptados o editados y verificados de tu diagnóstico emitido. Cada elemento dice de
        qué hallazgos deriva; el programa descarta los que no tengan respaldo.
      </p>
      <button type="button" className="primary" aria-disabled={running || blocked !== null} aria-busy={running} aria-describedby="estr-real-estado" onClick={() => void run()}>
        Generar estrategia
      </button>
      <div id="estr-real-estado" role="status" aria-live="polite" className="generating">
        {blocked && <p data-testid="real-blocked">{blocked}</p>}
        {running && <p>Ejecutando el agente; puede tardar un minuto…</p>}
      </div>
      {error && (
        <div role="alert" className="field-error-box" data-testid="strategy-real-unavailable" data-category={error.category}>
          <h3>Estrategia real no disponible</h3>
          <p>
            <strong>{error.message}</strong>
            {error.providerCode ? ` (código ${error.providerCode})` : ''}
          </p>
          <p>Este proyecto sigue en modo IA real: no se le pone la estrategia de ejemplo del modo Simulado.</p>
          {HINT[error.category] && <p>{HINT[error.category]}</p>}
          {RETRYABLE.has(error.category) && (
            <button type="button" onClick={() => void run()}>
              Reintentar
            </button>
          )}
          {error.trace && <TraceView run={{ steps: error.trace }} />}
        </div>
      )}
    </section>
  );
}
