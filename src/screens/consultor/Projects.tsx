import { COMPANIES } from '../../data/companies';
import { PROJECTS } from '../../data/projects';
import { ProjectCard } from '../../components/ProjectCard';
import { buildEvidenceItems } from '../../domain/evidence';
import { projectProgress } from '../../domain/progress';
import { formatScore } from '../../domain/format';
import { useAppState } from '../../state/context';
import type { Grading } from '../../state/types';

function deliveryText(g: Grading | undefined): string {
  return g ? `Calificada · ${formatScore(g.average)} de 5` : 'Por revisar';
}

export function Projects() {
  const { state } = useAppState();
  const mine = PROJECTS.filter((p) => p.ownedByDemoConsultor);
  return (
    <>
      <h1>Proyectos</h1>
      <p>Proyectos del Equipo 1. Todos los datos son ficticios.</p>
      <ul className="cards list-plain">
        {mine.map((p) => {
          const company = COMPANIES.find((c) => c.id === p.companyId)!;
          const ps = state.projects[p.id];
          const evidenceCount = buildEvidenceItems(p, company.name, ps.localFiles).length;
          const progress = projectProgress({ evidenceCount, diagnosis: ps.diagnosis.status, strategy: ps.strategy.status });
          const deliveries = [
            ps.diagnosis.status === 'issued' ? { label: 'Diagnóstico', text: deliveryText(state.gradings['dx/' + p.id]) } : null,
            ps.strategy.status === 'sent' ? { label: 'Estrategia', text: deliveryText(state.gradings['st/' + p.id]) } : null,
          ].filter((x): x is { label: string; text: string } => x !== null);
          return (
            <li key={p.id}>
              <ProjectCard project={p} company={company} progress={progress} deliveries={deliveries} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
