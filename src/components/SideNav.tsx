import type { ReactNode } from 'react';
import { COMPANIES } from '../data/companies';
import { getDiagnosis, modeOf } from '../providers';
import { PROJECTS } from '../data/projects';
import { deliveriesFor } from '../domain/deliveries';
import { buildEvidenceItems } from '../domain/evidence';
import { flowSteps, type StepStatus } from '../domain/flow';
import { reviewProgress } from '../domain/review';
import { useAppState } from '../state/context';
import { FEATURES } from '../app/features';
import { navItemsFor } from '../app/navItems';
import type { Role, RouteId, RouteMatch } from '../app/router';

const STATUS_CLASS: Record<StepStatus, string> = {
  Pendiente: 'badge-pending',
  'En curso': 'badge-warn',
  Completado: 'badge-ok',
  Bloqueado: 'badge-blocked',
  Disponible: 'badge-sim',
};

const STEP_ROUTE = {
  evidencia: { id: 'consultor.evidence', path: 'evidencia' },
  diagnostico: { id: 'consultor.diagnosis', path: 'diagnostico' },
  revision: { id: 'consultor.review', path: 'revision' },
  estrategia: { id: 'consultor.strategy', path: 'estrategia' },
} as const;

function NavLink({ href, current, children }: { href: string; current: boolean; children: ReactNode }) {
  return (
    <a href={href} aria-current={current ? 'page' : undefined}>
      {children}
    </a>
  );
}

interface Props {
  role: Role;
  route: RouteMatch;
}

/**
 * Navegación por rol (FR-049): barra lateral desde 1024 px; por debajo, barra de pestañas siempre visible bajo la cabecera.
 */
export function SideNav({ role, route }: Props) {
  const { state } = useAppState();
  const is = (id: RouteId) => route.id === id;

  const projectId = role === 'consultor' ? route.params.projectId : undefined;
  const project = projectId ? PROJECTS.find((p) => p.id === projectId) : undefined;
  const company = project ? COMPANIES.find((c) => c.id === project.companyId)! : undefined;

  let steps: ReturnType<typeof flowSteps> = [];
  if (project && company) {
    const ps = state.projects[project.id];
    steps = flowSteps({
      evidenceCount: modeOf(ps) === 'real' ? (ps.serverFiles ?? []).length : buildEvidenceItems(project, company.name, ps.localFiles).length,
      hasAnswers: Object.values(ps.answers).some((v) => v.trim() !== ''),
      diagnosis: ps.diagnosis.status,
      reviewed: reviewProgress(getDiagnosis(ps).ids, ps.diagnosis.decisions).reviewed,
      strategy: ps.strategy.status,
    });
  }

  const pendingDeliveries = role === 'lider' ? deliveriesFor(state).filter((d) => !d.graded).length : 0;
  const items = navItemsFor(role, { pendingDeliveries, summaryExists: FEATURES.contactSummary, surveyExists: FEATURES.survey, reportExists: FEATURES.contactSummary });
  // En la lista de proyectos no hace falta barra bajo 1024 px.
  const bare = role === 'consultor' && !project;
  const noNav = items.length === 0 && !project;

  if (noNav) return null;
  return (
    <div className="sidebar">
      <nav id="navegacion" className={bare ? 'sidenav nav-bare' : 'sidenav'} aria-label="Navegación principal">
        <ul className="nav-list">
          {items.map((it) => (
            <li key={it.routeId} className={project ? 'nav-back' : undefined}>
              <NavLink href={it.href} current={is(it.routeId)}>
                {project && <span className="nav-arrow" aria-hidden="true">← </span>}
                {it.label}
              </NavLink>
            </li>
          ))}
          {project && company && (
            <li className="nav-project">
              <p className="nav-project-name">{company.name}</p>
              <ol className="nav-steps" aria-label={`Pasos de ${company.name}`}>
                {steps.map((s) => {
                  const r = STEP_ROUTE[s.id];
                  return (
                    <li key={s.id}>
                      <NavLink href={`#/consultor/proyectos/${project.id}/${r.path}`} current={is(r.id)}>
                        <span>{s.label}</span>
                        <span className={`badge ${STATUS_CLASS[s.status]}`}>{s.status}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ol>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
