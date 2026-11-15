import { Kicker } from '../../components/Kicker';
import { useState } from 'react';
import { KpiCard } from '../../components/KpiCard';
import { ReviewQueue } from '../../components/ReviewQueue';
import { hasRealIssued } from '../../domain/visual';
import { MaturityProjectsPanel, StagePanel } from '../../components/charts/Panels';
import { PillarAverages } from '../../components/PillarAverages';
import { TeamsTable } from '../../components/TeamsTable';
import { TEAMS } from '../../data/teams';
import { buildEvidenceItems } from '../../domain/evidence';
import { deliveriesFor } from '../../domain/deliveries';
import { allProjects, companyFor } from '../../domain/lookup';
import { formatDecimal, formatScore } from '../../domain/format';
import { MIX_NOTE, averageMaturity, averageMixesModes } from '../../domain/maturity';
import { projectProgress } from '../../domain/progress';
import { averageOfGradings } from '../../domain/rubric';
import { useAppState } from '../../state/context';
import { DashboardResumen } from '../../components/DashboardResumen';
import { VistaControl } from '../../components/VistaControl';
import { tableroHref, vistaInicial, type Vista } from '../../app/vista';

/** Tarjetas máximas de la cola en el Tablero; el resto se ve en la pantalla de entregas. */
const QUEUE_LIMIT = 3;

export function Dashboard({ vista: vistaRuta }: { vista?: string }) {
  const { state } = useAppState();
  const [query, setQuery] = useState('');
  const pending = deliveriesFor(state).filter((d) => !d.graded);
  const activeTeams = TEAMS.filter((t) =>
    allProjects(state.createdProjects).some((p) => {
      if (p.teamId !== t.id) return false;
      const company = companyFor(p, state.createdProjects);
      const ps = state.projects[p.id];
      return projectProgress({ evidenceCount: buildEvidenceItems(p, company.name, ps.localFiles).length, diagnosis: ps.diagnosis.status, strategy: ps.strategy.status }).percent > 0;
    }),
  ).length;
  const avg = averageOfGradings(state.gradings);
  const mean = avg === null ? '—' : `${formatScore(avg)} de 5`;
  const maturity = averageMaturity(state);
  // AG-036: la ruta base abre la vista inicial (compilación).
  const vista: Vista = vistaRuta === 'resumen' || vistaRuta === 'detalle' ? vistaRuta : vistaInicial();

  return (
    <>
      <Kicker>LÍDER · TABLERO</Kicker>
      <div className="titulo-fila">
        <h1>Tablero</h1>
        <VistaControl vista={vista} href={tableroHref} />
      </div>
      <p>
        Equipos del programa. Todos los datos son ficticios. Los proyectos, calificaciones y entregas iniciales son ejemplos precargados;
        «Restablecer demo» los recupera.
      </p>
      {vista === 'resumen' ? (
        <DashboardResumen state={state} pending={pending} activeTeams={activeTeams} />
      ) : (
      <>
      <section aria-label="Indicadores" className="cards kpi-grid">
        <KpiCard testId="kpi-equipos" label="Equipos activos" value={String(activeTeams)} />
        <KpiCard testId="kpi-por-revisar" label="Entregas por revisar" value={String(pending.length)} />
        <KpiCard testId="kpi-promedio" label="Promedio de calificaciones" value={mean} />
        <KpiCard testId="kpi-madurez" label="Madurez promedio (de 5)" value={maturity === null ? '—' : formatDecimal(maturity)} />
      </section>
      {averageMixesModes(state) && (
        <p className="subtitle" data-testid="mix-note">
          {MIX_NOTE}
        </p>
      )}
      <div className="dash-split">
        <section aria-labelledby="tab-equipos">
          <h2 id="tab-equipos">Equipos</h2>
          <div className="field">
            <label htmlFor="buscar-equipo">Buscar equipo o empresa</label>
            <input id="buscar-equipo" type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
          </div>
          <TeamsTable state={state} query={query} />
        </section>
        <section aria-labelledby="tab-cola">
          <h2 id="tab-cola">Cola de revisión</h2>
          <ReviewQueue deliveries={pending} limit={QUEUE_LIMIT} />
          {pending.length > QUEUE_LIMIT && (
            <p>
              <a href="#/lider/entregas" data-testid="queue-see-all">
                Ver las {pending.length} entregas por revisar
              </a>
            </p>
          )}
        </section>
      </div>
      <div className="dash-charts">
        <StagePanel state={state} />
        <MaturityProjectsPanel state={state} />
      </div>
      {hasRealIssued(state) && (
        <div className="dash-columns">
          <PillarAverages state={state} />
        </div>
      )}
      </>
      )}
    </>
  );
}
