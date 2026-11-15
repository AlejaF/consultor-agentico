import { COMPANIES, type Company } from '../data/companies';
import { PROJECTS, type Project } from '../data/projects';
import { TEAMS } from '../data/teams';
import type { CreatedProject } from '../state/types';
import { CREATED_LABEL, NO_SECTOR } from './createdProjects';

function fromCreated(c: CreatedProject): { project: Project; company: Company } {
  return {
    project: { id: c.id, teamId: 'T-0', companyId: c.id, ownedByDemoConsultor: true, lastActivityLabel: CREATED_LABEL, sampleSlots: [], pendingSlots: [], created: true },
    company: { id: c.id, name: c.companyName, sector: c.sector?.trim() || NO_SECTOR, size: '—', city: '—', website: '—' },
  };
}

/** Los 7 proyectos de ejemplo y, al final, los creados por el Consultor (Equipo 1). */
export function allProjects(created: readonly CreatedProject[] = []): Project[] {
  return [...PROJECTS, ...created.map((c) => fromCreated(c).project)];
}

export function companyFor(project: Project, created: readonly CreatedProject[] = []): Company {
  const c = project.created ? created.find((x) => x.id === project.id) : undefined;
  return c ? fromCreated(c).company : COMPANIES.find((x) => x.id === project.companyId)!;
}

export function projectInfo(projectId: string, created: readonly CreatedProject[] = []) {
  const example = PROJECTS.find((p) => p.id === projectId);
  const made = example ? undefined : created.find((c) => c.id === projectId);
  const { project, company } = made ? fromCreated(made) : { project: example!, company: COMPANIES.find((c) => c.id === example!.companyId)! };
  const team = TEAMS.find((t) => t.id === project.teamId)!;
  return { project, company, team };
}
