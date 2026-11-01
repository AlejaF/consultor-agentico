import { COMPANIES } from '../../data/companies';
import { PROJECTS } from '../../data/projects';
import { ProjectCard } from '../../components/ProjectCard';
import { buildEvidenceItems } from '../../domain/evidence';
import { projectProgress } from '../../domain/progress';
import { useAppState } from '../../state/context';

export function Projects() {
  const { state } = useAppState();
  const mine = PROJECTS.filter((p) => p.ownedByDemoConsultor);
  return (
    <>
      <h1>Proyectos</h1>
      <p>Proyectos del Equipo Demo Alfa. Todos los datos son ficticios.</p>
      <ul className="cards list-plain">
        {mine.map((p) => {
          const company = COMPANIES.find((c) => c.id === p.companyId)!;
          const ps = state.projects[p.id];
          const evidenceCount = buildEvidenceItems(p, company.name, ps.localFiles).length;
          const progress = projectProgress({ evidenceCount, diagnosis: ps.diagnosis.status, strategy: ps.strategy.status });
          return (
            <li key={p.id}>
              <ProjectCard project={p} company={company} progress={progress} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
