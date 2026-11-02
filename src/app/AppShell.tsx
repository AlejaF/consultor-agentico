import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DemoBanner } from '../components/DemoBanner';
import { Notice } from '../components/Notice';
import { ResetDemoButton } from '../components/ResetDemoButton';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { SideNav } from '../components/SideNav';
import { COMPANY_PROJECT_ID } from '../data/survey';
import { projectInfo } from '../domain/lookup';
import { NOTICE_TEXT, useAppState } from '../state/context';
import type { Role, RouteMatch } from './router';

/** Al cambiar de ruta: título, anuncio y foco en el h1 (FR-038, FR-040). */
function useRouteAnnouncer(route: RouteMatch) {
  const [announcement, setAnnouncement] = useState('');
  const first = useRef(true);
  const key = `${route.id}|${JSON.stringify(route.params)}`;
  useEffect(() => {
    // Los informes llevan el nombre de la empresa en el título del documento: es también el nombre sugerido al guardar como PDF (FR-047)
    const isReport = route.id === 'consultor.report' || route.id === 'lider.deliveryReport' || route.id === 'contacto.report';
    document.title = isReport ? `${route.title} · ${projectInfo(route.params.projectId ?? COMPANY_PROJECT_ID).company.name} (DEMO)` : `${route.title} · Consultor Agéntico (DEMO)`;
    setAnnouncement(`Pantalla: ${route.title}`);
    if (first.current) {
      first.current = false;
      return; // la carga inicial conserva el orden natural (el primero es «Saltar al contenido»)
    }
    const h1 = document.querySelector<HTMLElement>('main h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return announcement;
}

interface Props {
  route: RouteMatch;
  role: Role | null;
  routeNotice: string | null;
  onDismissRouteNotice: () => void;
  children: ReactNode;
}

export function AppShell({ route, role, routeNotice, onDismissRouteNotice, children }: Props) {
  const { loadNotice, dismissLoadNotice, memoryMode } = useAppState();
  const announcement = useRouteAnnouncer(route);
  const mainRef = useRef<HTMLElement>(null);


  return (
    <div className="app">
      <a
        className="skip-link"
        href="#contenido"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <DemoBanner />
      {role && (
        <header className="topbar">
          <span className="brand">
            <img src={`${import.meta.env.BASE_URL}emblema.svg`} alt="" />
            Consultor Agéntico
          </span>
          <a className="home-link" href="#/">
            Inicio
          </a>
          <span className="topbar-break" aria-hidden="true" />
          <RoleSwitcher role={role} />
          <ResetDemoButton />
        </header>
      )}
      <div className={role ? 'shell-body' : undefined}>
        {role && <SideNav role={role} route={route} />}
        <main id="contenido" ref={mainRef} tabIndex={-1} className={role ? 'main' : undefined}>
          <div aria-live="polite" role="status" data-testid="notices">
            {memoryMode && <Notice>{NOTICE_TEXT.memory}</Notice>}
            {loadNotice && <Notice onDismiss={dismissLoadNotice}>{NOTICE_TEXT[loadNotice]}</Notice>}
            {routeNotice && <Notice onDismiss={onDismissRouteNotice}>{routeNotice}</Notice>}
          </div>
          {children}
        </main>
      </div>
      <div className="visually-hidden" aria-live="polite" role="status" data-testid="route-announcer">
        {announcement}
      </div>
    </div>
  );
}
