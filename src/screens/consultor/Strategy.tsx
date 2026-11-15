import { Kicker } from '../../components/Kicker';
import { DeliveryStatus } from '../../components/DeliveryStatus';
import { GenerateButton } from '../../components/GenerateButton';
import { StrategyView } from '../../components/StrategyView';
import { RealStrategyGenerate } from '../../components/RealStrategyGenerate';
import { RunNotices, TraceView } from '../../components/TraceView';
import { getDiagnosis, getStrategy, modeOf } from '../../providers';
import { blockedStrategyLink } from '../../domain/flow';
import { formatDateTime } from '../../domain/format';
import { projectInfo } from '../../domain/lookup';
import { deriveStrategy } from '../../domain/strategy';
import { useAppState } from '../../state/context';
import { VistaControl } from '../../components/VistaControl';
import { StrategyResumen } from '../../components/StrategyResumen';
import { estrategiaHref, sectionTargetEstrategia, vistaInicial, type Vista } from '../../app/vista';
import { useDestino } from '../../app/useDestino';

export function Strategy({ projectId, vista: vistaRuta, seccion }: { projectId: string; vista?: string; seccion?: string }) {
  const { state, dispatch } = useAppState();
  const { company } = projectInfo(projectId, state.createdProjects);
  const ps = state.projects[projectId];
  const issued = ps.diagnosis.status === 'issued';
  const real = modeOf(ps) === 'real';
  const view = getDiagnosis(ps);
  const status = ps.strategy.status;
  // AG-036: la ruta base abre la vista inicial (compilación); sin estrategia generada no hay nada que resumir.
  const hayEstrategia = issued && status !== 'none';
  const vista: Vista = !hayEstrategia ? 'detalle' : vistaRuta === 'resumen' || vistaRuta === 'detalle' ? vistaRuta : vistaInicial();
  useDestino(vista === 'detalle' ? sectionTargetEstrategia(seccion) : null, projectId, status);
  const link = blockedStrategyLink(ps.diagnosis.status === 'issued' ? 'generated' : ps.diagnosis.status);

  return (
    <>
      <Kicker>PASO 4 · ESTRATEGIA</Kicker>
      <h1>Estrategia</h1>
      <p>
        {company.name} · Proyecto {projectId}
        {vista === 'resumen' && (
          <>
            {' '}
            <span className="badge badge-pending" data-testid="resumen-modo">
              {real ? 'IA real' : 'Simulado'}
            </span>
          </>
        )}
      </p>
      {hayEstrategia && <VistaControl vista={vista} href={(v) => estrategiaHref(projectId, v)} />}

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

      {issued && real && status === 'none' && <RealStrategyGenerate projectId={projectId} companyName={company.name} />}

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

      {hayEstrategia && vista === 'resumen' && (
        <StrategyResumen
          projectId={projectId}
          derived={deriveStrategy(getStrategy(ps).template, view.findings, ps.diagnosis.decisions)}
          ai={real}
          {...(real ? { findings: view.findings } : {})}
          {...(real && ps.real?.strategyRun ? { run: ps.real.strategyRun } : {})}
          adopted={view.findings.filter((f) => ['accepted', 'edited'].includes(ps.diagnosis.decisions[f.id]?.state ?? 'pending'))}
          estado={status === 'sent' ? 'sent' : 'generated'}
          onSend={() => dispatch({ type: 'sendStrategy', projectId, at: new Date().toISOString() })}
        />
      )}

      {hayEstrategia && vista === 'detalle' && (
        <>
          <p>
            <a className="btn" href={estrategiaHref(projectId, 'resumen')} data-testid="volver-resumen">
              ← Volver al Resumen
            </a>
          </p>
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
          {real && ps.real?.strategyRun && <RunNotices run={ps.real.strategyRun} />}
          <StrategyView derived={deriveStrategy(getStrategy(ps).template, view.findings, ps.diagnosis.decisions)} ai={real} {...(real ? { findings: view.findings } : {})} adopted={view.findings.filter((f) => ['accepted', 'edited'].includes(ps.diagnosis.decisions[f.id]?.state ?? 'pending'))} />
          {real && ps.real?.strategyRun && <TraceView run={ps.real.strategyRun} />}
          {status === 'sent' && <DeliveryStatus deliveryId={`st/${projectId}`} label="de la estrategia" />}
        </>
      )}
    </>
  );
}
