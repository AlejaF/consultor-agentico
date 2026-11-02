import type { Company } from '../data/companies';
import type { Project } from '../data/projects';
import type { ProjectProgress } from '../domain/progress';
import { StatusBadge } from './badges';
import { ProgressBar } from './ProgressBar';

interface Props {
  project: Project;
  company: Company;
  progress: ProjectProgress;
  /** Estado de las entregas del proyecto (FR-032). */
  deliveries?: { label: string; text: string }[];
}

export function ProjectCard({ project, company, progress, deliveries = [] }: Props) {
  return (
    <article className="card project-card">
      <h2>{company.name}</h2>
      <p className="subtitle">
        Proyecto {project.id} · {company.sector}
      </p>
      <dl className="facts">
        <div>
          <dt>Etapa</dt>
          <dd>{progress.stage}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>
            <StatusBadge status={progress.status} />
          </dd>
        </div>
        <div>
          <dt>Última actividad</dt>
          <dd>{project.lastActivityLabel}</dd>
        </div>
        {deliveries.length > 0 && (
          <div>
            <dt>Entregas</dt>
            <dd>
              {deliveries.map((d) => (
                <span key={d.label} className="delivery-line">
                  {d.label}: {d.text}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
      <ProgressBar percent={progress.percent} label={`Avance de ${company.name}`} />
      <p>
        <a className="btn" href={`#/consultor/proyectos/${project.id}/evidencia`}>
          Captura de evidencia<span className="visually-hidden"> de {company.name}</span>
        </a>
      </p>
    </article>
  );
}
