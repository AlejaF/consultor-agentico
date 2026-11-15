import { Kicker } from '../../components/Kicker';
import { useState } from 'react';
import { NewProjectForm } from '../../components/NewProjectForm';
import { ProjectCard } from '../../components/ProjectCard';
import { buildEvidenceItems } from '../../domain/evidence';
import { allProjects, companyFor } from '../../domain/lookup';
import { modeOf } from '../../providers';
import { useAvailability } from '../../providers/useAvailability';
import { projectProgress } from '../../domain/progress';
import { formatScore } from '../../domain/format';
import { useAppState } from '../../state/context';
import type { Grading } from '../../state/types';

function deliveryText(g: Grading | undefined): string {
  return g ? `Calificada · ${formatScore(g.average)} de 5` : 'Por revisar';
}

export function Projects() {
  const { state } = useAppState();
  const availability = useAvailability();
  const [creating, setCreating] = useState(false);
  const isConsultor = state.session.role === 'consultor';
  const available = availability.state === 'available';
  const mine = allProjects(state.createdProjects).filter((p) => p.ownedByDemoConsultor);
  return (
    <>
      <Kicker>PROYECTOS</Kicker>
      <h1>Proyectos</h1>
      <p>
        Proyectos del Equipo 1. Todos los datos son ficticios. Los proyectos, calificaciones y entregas iniciales son ejemplos precargados;
        «Restablecer demo» los recupera.
      </p>
      {isConsultor && (
        <div className="new-project">
          <button
            type="button"
            className="primary"
            data-testid="new-project-button"
            aria-disabled={!available || creating || undefined}
            aria-describedby={availability.state === 'unavailable' ? 'new-project-unavailable' : undefined}
            onClick={() => available && setCreating(true)}
          >
            + Nuevo proyecto
          </button>
          {availability.state === 'unavailable' && (
            <p className="subtitle" id="new-project-unavailable" data-testid="new-project-unavailable">
              Requiere IA real (ejecutar la app en tu equipo)
            </p>
          )}
        </div>
      )}
      {isConsultor && creating && <NewProjectForm onClose={() => setCreating(false)} />}
      <ul className="cards list-plain">
        {mine.map((p) => {
          const company = companyFor(p, state.createdProjects);
          const ps = state.projects[p.id];
          const evidenceCount = modeOf(ps) === 'real' ? (ps.serverFiles ?? []).length : buildEvidenceItems(p, company.name, ps.localFiles).length;
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
