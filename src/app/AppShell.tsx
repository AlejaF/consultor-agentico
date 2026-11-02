import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DemoBanner } from '../components/DemoBanner';
import { Notice } from '../components/Notice';
import { ResetDemoButton } from '../components/ResetDemoButton';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { SideNav } from '../components/SideNav';
import { NOTICE_TEXT, useAppState } from '../state/context';
import type { Role, RouteMatch } from './router';

/** Al cambiar de ruta: título, anuncio y foco en el h1 (FR-038, FR-040). */
function useRouteAnnouncer(route: RouteMatch) {
  const [announcement, setAnnouncement] = useState('');
  const first = useRef(true);
  const key = `${route.id}|${JSON.stringify(route.params)}`;
  useEffect(() => {
    document.title = `${route.title} · Consultor Agéntico (DEMO)`;
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
          <a className="brand" href="#/">
            <img src={`${import.meta.env.BASE_URL}emblema.svg`} alt="" />
            Consultor Agéntico
          </a>
          <a className="home-link" href="#/">
            Inicio
          </a>
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
