import { tableroHref } from '../app/vista';
import { stageSegments } from '../domain/charts';
import type { Delivery } from '../domain/deliveries';
import { countOf, formatDecimal, formatScore } from '../domain/format';
import { MIX_NOTE, averageMaturity, averageMixesModes, projectMaturity } from '../domain/maturity';
import { allProjects } from '../domain/lookup';
import { averageOfGradings } from '../domain/rubric';
import type { PersistedState } from '../state/types';
import { MaturityProjectsPanel, projectStages } from './charts/Panels';
import { KpiCard } from './KpiCard';
import { TeamsTable } from './TeamsTable';

/**
 * Resumen del Tablero (AG-036, H4b): 4 cifras con su contexto, tabla de equipos simplificada, cola compacta y UN solo gráfico.
 * Ninguna cifra se repite en dos bloques (el contexto de «Equipos activos» reemplaza al gráfico «Proyectos por etapa»).
 * El Detalle conserva todo lo demás.
 */
export function DashboardResumen({ state, pending, activeTeams }: { state: PersistedState; pending: readonly Delivery[]; activeTeams: number }) {
  const etapas = stageSegments(projectStages(state));
  const avg = averageOfGradings(state.gradings);
  const maturity = averageMaturity(state);
  const nGradings = Object.keys(state.gradings).length;
  const conNivel = allProjects(state.createdProjects).filter((p) => projectMaturity(state, p.id) !== null).length;
  const mezcla = averageMixesModes(state);
  const dx = pending.filter((d) => d.tipo === 'dx').length;
  const st = pending.length - dx;
  return (
    <div className="resumen resumen-tablero" data-testid="tablero-resumen">
      <section aria-label="Indicadores" className="cards kpi-grid resumen-ancho" data-resumen="visual">
        <KpiCard
          testId="kpi-equipos"
          label="Equipos activos"
          value={String(activeTeams)}
          hint={`${countOf(etapas.total, 'proyecto', 'proyectos')} · ${etapas.parts.filter((p) => p.n > 0).map((p) => `${p.n} en ${p.label}`).join(', ') || 'ninguno con avance'}`}
        />
        <KpiCard
          testId="kpi-por-revisar"
          label="Entregas por revisar"
          value={String(pending.length)}
          hint={
            <>
              {pending.length === 0 ? 'Nada pendiente' : `${countOf(dx, 'diagnóstico', 'diagnósticos')} · ${countOf(st, 'estrategia', 'estrategias')}`}{' '}
              <a className="kpi-link" href="#/lider/entregas" data-testid="kpi-ver-entregas">
                Ver entregas →
              </a>
            </>
          }
        />
        <KpiCard testId="kpi-promedio" label="Promedio de calificaciones" value={avg === null ? '—' : `${formatScore(avg)} de 5`} hint={nGradings === 0 ? 'Sin calificaciones todavía' : countOf(nGradings, 'calificación', 'calificaciones')} />
        <KpiCard testId="kpi-madurez" label="Madurez promedio (de 5)" value={maturity === null ? '—' : formatDecimal(maturity)} hint={conNivel === 0 ? 'Ningún proyecto con nivel' : `${countOf(conNivel, 'proyecto', 'proyectos')} con nivel${mezcla ? ' · mezcla real e ilustrativo' : ''}`} />
      </section>
      {mezcla && (
        <p className="visually-hidden" data-testid="mix-note">
          {MIX_NOTE}
        </p>
      )}
      <div className="dash-split resumen-cuerpo">
        <section aria-labelledby="tab-equipos" data-resumen="principal">
          <h2 id="tab-equipos">Equipos</h2>
          <TeamsTable state={state} variant="resumen" />
          <p className="resumen-boton">
            <a className="resumen-enlace" href={tableroHref('detalle')} data-testid="resumen-detalle-link">
              Ver tabla completa y filtros →
            </a>
          </p>
        </section>
        <div data-resumen="visual">
          <MaturityProjectsPanel state={state} compact />
        </div>
      </div>
    </div>
  );
}
