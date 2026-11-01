import { COMPANIES } from '../data/companies';
import { PROJECTS } from '../data/projects';
import { TEAMS } from '../data/teams';

export function projectInfo(projectId: string) {
  const project = PROJECTS.find((p) => p.id === projectId)!;
  const company = COMPANIES.find((c) => c.id === project.companyId)!;
  const team = TEAMS.find((t) => t.id === project.teamId)!;
  return { project, company, team };
}
