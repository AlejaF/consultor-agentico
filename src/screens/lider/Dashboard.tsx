import { useState } from 'react';
import { KpiCard } from '../../components/KpiCard';
import { ReviewQueue } from '../../components/ReviewQueue';
import { hasRealIssued } from '../../domain/visual';
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

export function Dashboard() {
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

  return (
    <>
      <h1>Tablero</h1>
      <p>
        Equipos del programa. Todos los datos son ficticios. Los proyectos, calificaciones y entregas iniciales son ejemplos precargados;
        «Restablecer demo» los recupera.
      </p>
      <section aria-label="Indicadores" className="cards">
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
      {hasRealIssued(state) && <PillarAverages state={state} />}
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
        <ReviewQueue deliveries={pending} />
      </section>
    </>
  );
}
