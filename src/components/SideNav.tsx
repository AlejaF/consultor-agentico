import type { ReactNode } from 'react';
import { ACCOUNTS } from '../data/accounts';
import { COMPANIES } from '../data/companies';
import { FINDING_IDS } from '../data/diagnosis';
import { PROJECTS } from '../data/projects';
import { deliveriesFor } from '../domain/deliveries';
import { buildEvidenceItems } from '../domain/evidence';
import { flowSteps, type StepStatus } from '../domain/flow';
import { reviewProgress } from '../domain/review';
import { useAppState } from '../state/context';
import { homeOf, type Role, type RouteId, type RouteMatch } from '../app/router';
import { ResetDemoButton } from './ResetDemoButton';

const STATUS_CLASS: Record<StepStatus, string> = {
  Pendiente: 'badge-pending',
  'En curso': 'badge-warn',
  Completado: 'badge-ok',
  Bloqueado: 'badge-blocked',
};

const STEP_ROUTE = {
  evidencia: { id: 'consultor.evidence', path: 'evidencia' },
  diagnostico: { id: 'consultor.diagnosis', path: 'diagnostico' },
  revision: { id: 'consultor.review', path: 'revision' },
  estrategia: { id: 'consultor.strategy', path: 'estrategia' },
} as const;

function NavLink({ href, current, onNavigate, children }: { href: string; current: boolean; onNavigate: () => void; children: ReactNode }) {
  return (
    <a href={href} aria-current={current ? 'page' : undefined} onClick={onNavigate}>
      {children}
    </a>
  );
}

interface Props {
  role: Role;
  route: RouteMatch;
  open: boolean;
  onNavigate: () => void;
}

/** Navegación lateral por rol (FR-049); en celular es el menú desplegable. */
export function SideNav({ role, route, open, onNavigate }: Props) {
  const { state } = useAppState();
  const account = ACCOUNTS.find((a) => a.role === role)!;
  const is = (id: RouteId) => route.id === id;

  const projectId = role === 'consultor' ? route.params.projectId : undefined;
  const project = projectId ? PROJECTS.find((p) => p.id === projectId) : undefined;
  const company = project ? COMPANIES.find((c) => c.id === project.companyId)! : undefined;

  let steps: ReturnType<typeof flowSteps> = [];
  if (project && company) {
    const ps = state.projects[project.id];
    steps = flowSteps({
      evidenceCount: buildEvidenceItems(project, company.name, ps.localFiles).length,
      hasAnswers: Object.values(ps.answers).some((v) => v.trim() !== ''),
      diagnosis: ps.diagnosis.status,
      reviewed: reviewProgress(FINDING_IDS, ps.diagnosis.decisions).reviewed,
      strategy: ps.strategy.status,
    });
  }

  const pendingDeliveries = role === 'lider' ? deliveriesFor(state).filter((d) => !d.graded).length : 0;

  return (
    <nav id="navegacion" className={open ? 'sidenav open' : 'sidenav'} aria-label="Navegación principal">
      <ul className="nav-list">
        {role === 'consultor' && (
          <>
            <li>
              <NavLink href={homeOf('consultor')} current={is('consultor.projects')} onNavigate={onNavigate}>
                Proyectos
              </NavLink>
            </li>
            {project && company && (
              <li className="nav-project">
                <p className="nav-project-name">{company.name}</p>
                <ol className="nav-steps" aria-label={`Pasos de ${company.name}`}>
                  {steps.map((s) => {
                    const r = STEP_ROUTE[s.id];
                    return (
                      <li key={s.id}>
                        <NavLink href={`#/consultor/proyectos/${project.id}/${r.path}`} current={is(r.id)} onNavigate={onNavigate}>
                          <span>{s.label}</span>
                          <span className={`badge ${STATUS_CLASS[s.status]}`}>{s.status}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ol>
              </li>
            )}
          </>
        )}
        {role === 'lider' && (
          <>
            <li>
              <NavLink href={homeOf('lider')} current={is('lider.dashboard')} onNavigate={onNavigate}>
                Tablero
              </NavLink>
            </li>
            <li>
              <NavLink href="#/lider/entregas" current={is('lider.deliveries')} onNavigate={onNavigate}>
                Entregas por revisar ({pendingDeliveries})
              </NavLink>
            </li>
          </>
        )}
        {role === 'contacto' && (
          <>
            <li>
              <NavLink href={homeOf('contacto')} current={is('contacto.summary')} onNavigate={onNavigate}>
                Resumen
              </NavLink>
            </li>
            <li>
              <NavLink href="#/contacto/encuesta" current={is('contacto.survey')} onNavigate={onNavigate}>
                Encuesta
              </NavLink>
            </li>
          </>
        )}
      </ul>

      <div className="nav-footer">
        <div className="account-card">
          <p>
            <strong>{account.displayName}</strong> · cuenta ficticia
          </p>
        </div>
        <hr />
        <ResetDemoButton />
      </div>
    </nav>
  );
}
