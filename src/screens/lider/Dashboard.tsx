import { KpiCard } from '../../components/KpiCard';
import { ReviewQueue } from '../../components/ReviewQueue';
import { TeamsTable } from '../../components/TeamsTable';
import { COMPANIES } from '../../data/companies';
import { PROJECTS } from '../../data/projects';
import { TEAMS } from '../../data/teams';
import { buildEvidenceItems } from '../../domain/evidence';
import { deliveriesFor } from '../../domain/deliveries';
import { formatScore } from '../../domain/format';
import { projectProgress } from '../../domain/progress';
import { averageOfGradings } from '../../domain/rubric';
import { useAppState } from '../../state/context';

export function Dashboard() {
  const { state } = useAppState();
  const pending = deliveriesFor(state).filter((d) => !d.graded);
  const activeTeams = TEAMS.filter((t) =>
    PROJECTS.some((p) => {
      if (p.teamId !== t.id) return false;
      const company = COMPANIES.find((c) => c.id === p.companyId)!;
      const ps = state.projects[p.id];
      return projectProgress({ evidenceCount: buildEvidenceItems(p, company.name, ps.localFiles).length, diagnosis: ps.diagnosis.status, strategy: ps.strategy.status }).percent > 0;
    }),
  ).length;
  const avg = averageOfGradings(state.gradings);
  const mean = avg === null ? '—' : `${formatScore(avg)} de 5`;

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
      </section>
      <section aria-labelledby="tab-equipos">
        <h2 id="tab-equipos">Equipos</h2>
        <TeamsTable state={state} />
      </section>
      <section aria-labelledby="tab-cola">
        <h2 id="tab-cola">Cola de revisión</h2>
        <ReviewQueue deliveries={pending} />
      </section>
    </>
  );
}
