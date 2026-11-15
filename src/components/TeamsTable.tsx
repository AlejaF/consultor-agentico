import { TEAMS } from '../data/teams';
import { buildEvidenceItems } from '../domain/evidence';
import { countOf } from '../domain/format';
import { deliveriesFor } from '../domain/deliveries';
import { allProjects, companyFor } from '../domain/lookup';
import { projectProgress, type Stage } from '../domain/progress';
import { formatDecimal } from '../domain/format';
import { teamMaturity, teamMatches } from '../domain/maturity';
import type { PersistedState } from '../state/types';
import { ProgressBar } from './ProgressBar';
import { ResponsiveTable } from './ResponsiveTable';

const ORDER: Stage[] = ['Evidencia', 'Diagnóstico', 'Estrategia'];

/** Etapas visibles solo Evidencia, Diagnóstico y Estrategia (FR-028). */
export function TeamsTable({ state, query = '', variant = 'completa' }: { state: PersistedState; query?: string; variant?: 'completa' | 'resumen' }) {
  const deliveries = deliveriesFor(state);
  const projectsAll = allProjects(state.createdProjects);
  const visibles = TEAMS.filter((t) =>
    teamMatches(
      query,
      t.name,
      projectsAll.filter((p) => p.teamId === t.id).map((p) => companyFor(p, state.createdProjects).name),
    ),
  );
  if (visibles.length === 0) {
    return (
      <p role="status" data-testid="busqueda-sin-resultados">
        Sin resultados para «{query.trim()}».
      </p>
    );
  }
  const rows = visibles.map((t) => {
    const projects = projectsAll.filter((p) => p.teamId === t.id);
    const progress = projects.map((p) => {
      const company = companyFor(p, state.createdProjects);
      const ps = state.projects[p.id];
      return projectProgress({
        evidenceCount: buildEvidenceItems(p, company.name, ps.localFiles).length,
        diagnosis: ps.diagnosis.status,
        strategy: ps.strategy.status,
      });
    });
    const stage = progress.map((x) => x.stage).sort((a, b) => ORDER.indexOf(b) - ORDER.indexOf(a))[0];
    const percent = Math.round(progress.reduce((a, b) => a + b.percent, 0) / progress.length);
    const pending = deliveries.filter((d) => !d.graded && projects.some((p) => p.id === d.projectId)).length;
    return {
      id: t.id,
      cells: {
        team: variant === 'resumen' ? (<>{t.name}<span className="subtitle team-sub">{countOf(projects.length, 'proyecto', 'proyectos')}</span></>) : t.name,
        projects: countOf(projects.length, 'proyecto', 'proyectos'),
        stage: <span className="badge chip-pillar">{stage}</span>,
        progress: (
          <span className="row-progress">
            <ProgressBar percent={percent} label={`Avance de ${t.name}`} />
          </span>
        ),
        maturity: (() => { const m = teamMaturity(state, t); return m === null ? '—' : formatDecimal(m); })(),
        activity: projects[0].lastActivityLabel,
        pending: String(pending),
      },
    };
  });
  return (
    <ResponsiveTable
      testId="teams-table"
      caption="Equipos del programa"
      columns={
        variant === 'resumen'
          ? [
              { key: 'team', label: 'Equipo' },
              { key: 'stage', label: 'Etapa' },
              { key: 'progress', label: 'Avance' },
              { key: 'maturity', label: 'Madurez' },
            ]
          : [
              { key: 'team', label: 'Equipo' },
              { key: 'projects', label: 'Proyectos' },
              { key: 'stage', label: 'Etapa' },
              { key: 'progress', label: 'Avance' },
              { key: 'maturity', label: 'Madurez' },
              { key: 'activity', label: 'Última actividad' },
              { key: 'pending', label: 'Entregas por revisar' },
            ]
      }
      rows={rows}
    />
  );
}
