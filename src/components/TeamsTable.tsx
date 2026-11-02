import { COMPANIES } from '../data/companies';
import { PROJECTS } from '../data/projects';
import { TEAMS } from '../data/teams';
import { buildEvidenceItems } from '../domain/evidence';
import { countOf } from '../domain/format';
import { deliveriesFor } from '../domain/deliveries';
import { projectProgress, type Stage } from '../domain/progress';
import type { PersistedState } from '../state/types';
import { ResponsiveTable } from './ResponsiveTable';

const ORDER: Stage[] = ['Evidencia', 'Diagnóstico', 'Estrategia'];

/** Etapas visibles solo Evidencia, Diagnóstico y Estrategia (FR-028). */
export function TeamsTable({ state }: { state: PersistedState }) {
  const deliveries = deliveriesFor(state);
  const rows = TEAMS.map((t) => {
    const projects = PROJECTS.filter((p) => p.teamId === t.id);
    const progress = projects.map((p) => {
      const company = COMPANIES.find((c) => c.id === p.companyId)!;
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
        team: t.name,
        projects: countOf(projects.length, 'proyecto', 'proyectos'),
        stage,
        progress: `${percent} %`,
        activity: projects[0].lastActivityLabel,
        pending: String(pending),
      },
    };
  });
  return (
    <ResponsiveTable
      testId="teams-table"
      caption="Equipos del programa"
      columns={[
        { key: 'team', label: 'Equipo' },
        { key: 'projects', label: 'Proyectos' },
        { key: 'stage', label: 'Etapa' },
        { key: 'progress', label: 'Avance' },
        { key: 'activity', label: 'Última actividad' },
        { key: 'pending', label: 'Entregas por revisar' },
      ]}
      rows={rows}
    />
  );
}
