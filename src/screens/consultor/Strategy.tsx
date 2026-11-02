import { DeliveryStatus } from '../../components/DeliveryStatus';
import { GenerateButton } from '../../components/GenerateButton';
import { StrategyView } from '../../components/StrategyView';
import { DIAGNOSIS } from '../../data/diagnosis';
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

      {issued && status === 'none' && (
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

      {issued && status !== 'none' && (
        <>
          <section className="card" aria-label="Estado de la estrategia">
            <p>
              <span className={status === 'sent' ? 'badge badge-ok' : 'badge badge-warn'}>{status === 'sent' ? 'Enviada al Líder' : 'Generada'}</span>
            </p>
            {status === 'sent' && ps.strategy.sentAt && <p className="subtitle">Enviada el {formatDateTime(ps.strategy.sentAt)}</p>}
            {status === 'generated' && (
              <>
                <p className="subtitle">Revisa la estrategia y envíala al Líder para que la califique.</p>
                <button type="button" className="primary" onClick={() => dispatch({ type: 'sendStrategy', projectId, at: new Date().toISOString() })}>
                  Enviar a revisión
                </button>
              </>
            )}
          </section>
          <StrategyView derived={deriveStrategy(STRATEGY, DIAGNOSIS.findings, ps.diagnosis.decisions)} />
          {status === 'sent' && <DeliveryStatus deliveryId={`st/${projectId}`} label="la estrategia" />}
        </>
      )}
    </>
  );
}
