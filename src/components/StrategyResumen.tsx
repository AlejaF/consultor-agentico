import { estrategiaHref, slugId } from '../app/vista';
import type { Finding } from '../data/diagnosis';
import { groupByHorizon } from '../domain/charts';
import type { DerivedStrategy } from '../domain/strategy';
import { countOf } from '../domain/format';
import { AiBadge } from './AiBadge';
import { RiskLevelPanel, buildProvenance } from './charts/Panels';
import { SimBadge } from './badges';
import { RunNoticesResumen } from './TraceView';

const LEVEL_CLASS = { alto: 'badge-danger', medio: 'badge-warn', bajo: 'badge-ok' } as const;

/** Primera frase del detalle: en el Resumen cada fase lleva solo su título y una línea; el texto completo está en el Detalle. */
const primeraFrase = (t: string) => (t.split(/(?<=[.!?])\s/)[0] ?? t).trim();

/**
 * Resumen de Estrategia (AG-036, H4b): 2 cifras, riesgos por nivel, la ruta en columnas por horizonte y botones al Detalle.
 * Todo clic lleva al Detalle en la tarjeta. Nada técnico (sin traza, modelo ni tokens): ni siquiera se importa aquí.
 */
export function StrategyResumen({
  projectId,
  derived,
  findings,
  run,
  ai,
  adopted,
  estado,
  onSend,
}: {
  projectId: string;
  derived: DerivedStrategy;
  findings?: readonly Finding[];
  run?: Parameters<typeof RunNoticesResumen>[0]['run'];
  ai: boolean;
  adopted: readonly { id: string; title: string; verified: boolean }[];
  estado: 'generated' | 'sent';
  onSend: () => void;
}) {
  const prov = buildProvenance(derived, adopted);
  const hayTrazabilidad = prov.rows.length > 0 && prov.cols.length > 0;
  void findings;
  const groups = groupByHorizon(derived.route);
  const colOf = (it: (typeof derived.route)[number]) => groups.findIndex((g) => g.items.includes(it)) + 1;
  const cifra = (id: string, value: number, text: string) => (
    <div className="stat" data-testid={`resumen-cifra-${id}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{text}</span>
    </div>
  );
  const acciones = (
    <nav className="resumen-acciones" aria-label="Ir al detalle" data-testid="resumen-acciones">
      <a className="btn" href={estrategiaHref(projectId, 'detalle', 'riesgos-ruta')}>
        Ver riesgos y ruta en detalle
      </a>
      {hayTrazabilidad && (
        <a className="btn" href={estrategiaHref(projectId, 'detalle', 'trazabilidad')}>
          Ver trazabilidad
        </a>
      )}
      <a className="btn" href={`#/consultor/proyectos/${projectId}/informe`}>
        Ver informe imprimible
      </a>
      {estado === 'generated' && (
        <button type="button" className="primary" onClick={onSend}>
          Enviar a revisión
        </button>
      )}
    </nav>
  );
  const estadoFila = (
    <p className="resumen-estado">
      <span className={estado === 'sent' ? 'badge badge-ok' : 'badge badge-warn'}>{estado === 'sent' ? 'Enviada al Líder' : 'Generada'}</span> {!ai && <SimBadge />}
      {derived.unverifiedAdopted > 0 && (
        <span className="subtitle no-support" data-testid="unverified-unused">
          {' '}
          {countOf(derived.unverifiedAdopted, 'hallazgo aceptado', 'hallazgos aceptados')} sin usar como respaldo: NO VERIFICADO
        </span>
      )}
    </p>
  );
  return (
    <>
      {run && <RunNoticesResumen run={run} href={estrategiaHref(projectId, 'detalle')} />}
    <div className="resumen resumen-estrategia" data-testid="estrategia-resumen">
      {derived.empty ? (
        <section className="card resumen-ancho" data-testid="strategy-empty" aria-labelledby="resumen-vacia">
          <h2 id="resumen-vacia">Sin elementos de estrategia</h2>
          {estadoFila}
          <p>Ningún elemento de la estrategia tiene respaldo: solo se derivan de hallazgos aceptados o editados y verificados del diagnóstico emitido.</p>
          {acciones}
        </section>
      ) : (
        <>
          <div className="resumen-riesgos-col" data-resumen="visual">
            <RiskLevelPanel risks={derived.risks} title="Riesgos por nivel" {...(ai ? { badge: <AiBadge /> } : {})}>
              <ul className="list-plain resumen-riesgos" data-testid="resumen-riesgos" data-resumen="lista">
                {derived.risks.map((r) => (
                  <li key={r.id} data-testid={`resumen-riesgo-${r.id}`}>
                    <a className="resumen-pilar-link" href={estrategiaHref(projectId, 'detalle', `riesgo-${slugId(r.id)}`)}>
                      {r.label}&nbsp;<span aria-hidden="true">›</span>
                    </a>
                    {r.level && <span className={`badge ${LEVEL_CLASS[r.level]}`}>Nivel {r.level}</span>}
                  </li>
                ))}
              </ul>
            </RiskLevelPanel>
          </div>
          <div className="resumen-side">
            {estadoFila}
            <div className="stats-row stats-row-2" data-resumen="visual">
              {cifra('riesgos', derived.risks.length, derived.risks.length === 1 ? 'Riesgo' : 'Riesgos')}
              {cifra('fases', derived.route.length, derived.route.length === 1 ? 'Fase' : 'Fases')}
            </div>
            {acciones}
          </div>
          <section className="card resumen-ancho" aria-labelledby="resumen-ruta-t" data-resumen="principal">
            <div className="block-head">
              <h2 id="resumen-ruta-t">Ruta sugerida</h2>
              {ai && <AiBadge />}
            </div>
            <ol className="list-plain resumen-ruta" data-testid="resumen-ruta" style={{ ['--cols' as string]: Math.max(1, groups.length) }}>
              {derived.route.map((it, i) => (
                <li key={it.id} data-testid={`resumen-fase-${it.id}`} style={{ ['--col' as string]: colOf(it) }}>
                  {it.horizon && <span className="badge badge-pending chip-horizon">{it.horizon}</span>}
                  <a className="resumen-pilar-link resumen-fase-link" href={estrategiaHref(projectId, 'detalle', `fase-${slugId(it.id)}`)}>
                    Fase {i + 1}: {it.label}&nbsp;<span aria-hidden="true">›</span>
                  </a>
                  <p className="resumen-linea">{primeraFrase(it.detail)}</p>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
    </>
  );
}
