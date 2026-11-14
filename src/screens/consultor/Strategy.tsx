import { DeliveryStatus } from '../../components/DeliveryStatus';
import { GenerateButton } from '../../components/GenerateButton';
import { StrategyView } from '../../components/StrategyView';
import { getDiagnosis, modeOf } from '../../providers';
import { STRATEGY } from '../../data/strategy';
import { blockedStrategyLink } from '../../domain/flow';
import { formatDateTime } from '../../domain/format';
import { projectInfo } from '../../domain/lookup';
import { deriveStrategy } from '../../domain/strategy';
import { useAppState } from '../../state/context';

export function Strategy({ projectId }: { projectId: string }) {
  const { state, dispatch } = useAppState();
  const { company } = projectInfo(projectId);
  const ps = state.projects[projectId];
  const issued = ps.diagnosis.status === 'issued';
  const real = modeOf(ps) === 'real';
  const status = ps.strategy.status;
  const link = blockedStrategyLink(ps.diagnosis.status === 'issued' ? 'generated' : ps.diagnosis.status);

  return (
    <>
      <h1>Estrategia</h1>
      <p>
        {company.name} · Proyecto {projectId}
      </p>

      {!issued && (
        <section className="card" aria-labelledby="estrategia-estado">
          <h2 id="estrategia-estado">Estrategia bloqueada</h2>
          <p>La estrategia se deriva de un diagnóstico emitido. Emite primero el diagnóstico de este proyecto.</p>
          <p>
            <a className="btn primary" href={`#/consultor/proyectos/${projectId}/${link.step}`}>
              {link.label}
            </a>
          </p>
        </section>
      )}

      {issued && real && (
        <section className="card" aria-labelledby="estrategia-real" data-testid="strategy-real-pending">
          <h2 id="estrategia-real">Estrategia con IA real: aún no disponible</h2>
          <p>
            La estrategia con IA real todavía no está construida en esta versión (llega en un lote posterior). Este proyecto está en modo IA real, así que
            no se le mezcla la estrategia de ejemplo del modo Simulado. Puedes ver el informe del diagnóstico.
          </p>
          <p>
            <a className="btn" href={`#/consultor/proyectos/${projectId}/informe`}>
              Ver informe imprimible
            </a>
          </p>
        </section>
      )}

      {issued && !real && status === 'none' && (
        <section className="card" aria-labelledby="estrategia-generar">
          <h2 id="estrategia-generar">Generar estrategia</h2>
          <p>
            La estrategia se deriva de los hallazgos aceptados o editados y verificados de tu diagnóstico emitido. En esta demo el
            contenido es preparado y está rotulado como simulado.
          </p>
          <GenerateButton
            label="Generar estrategia"
            runningLabel="Generando estrategia…"
            onDone={() => dispatch({ type: 'generateStrategy', projectId, at: new Date().toISOString() })}
          />
        </section>
      )}

      {issued && !real && status !== 'none' && (
        <>
          <section className="card" aria-label="Estado de la estrategia">
            <p>
              <span className={status === 'sent' ? 'badge badge-ok' : 'badge badge-warn'}>{status === 'sent' ? 'Enviada al Líder' : 'Generada'}</span>
            </p>
            {status === 'sent' && ps.strategy.sentAt && <p className="subtitle">Enviada el {formatDateTime(ps.strategy.sentAt)}</p>}
            <p>
              <a className="btn" href={`#/consultor/proyectos/${projectId}/informe`}>
                Ver informe imprimible
              </a>
            </p>
            {status === 'generated' && (
              <>
                <p className="subtitle">Revisa la estrategia y envíala al Líder para que la califique.</p>
                <button type="button" className="primary" onClick={() => dispatch({ type: 'sendStrategy', projectId, at: new Date().toISOString() })}>
                  Enviar a revisión
                </button>
              </>
            )}
          </section>
          <StrategyView derived={deriveStrategy(STRATEGY, getDiagnosis(ps).findings, ps.diagnosis.decisions)} />
          {status === 'sent' && <DeliveryStatus deliveryId={`st/${projectId}`} label="la estrategia" />}
        </>
      )}
    </>
  );
}
