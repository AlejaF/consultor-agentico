import { useEffect, useMemo, useState } from 'react';
import { CONSULTOR_PROJECT_IDS } from '../data/projects';
import { Evidence } from '../screens/consultor/Evidence';
import { Projects } from '../screens/consultor/Projects';
import { Summary } from '../screens/contacto/Summary';
import { Dashboard } from '../screens/lider/Dashboard';
import { Login } from '../screens/Login';
import { StateProvider, useAppState } from '../state/context';
import { accessDecision, type AccessContext } from './access';
import { AppShell } from './AppShell';
import { replaceHash, useHashRoute, type RouteMatch } from './router';

function Screen({ route }: { route: RouteMatch }) {
  switch (route.id) {
    case 'login':
      return <Login />;
    case 'consultor.projects':
      return <Projects />;
    case 'consultor.evidence':
      return <Evidence projectId={route.params.projectId} />;
    case 'lider.dashboard':
      return <Dashboard />;
    case 'contacto.summary':
      return <Summary />;
    default:
      // Las demás pantallas se construyen en lotes posteriores.
      return <h1>{route.title}</h1>;
  }
}

function Routed() {
  const hash = useHashRoute();
  const { state } = useAppState();
  const role = state.session.role;

  const ctx = useMemo<AccessContext>(
    () => ({
      consultorProjectIds: CONSULTOR_PROJECT_IDS,
      deliveryExists: (tipo, id) =>
        tipo === 'dx' ? state.projects[id]?.diagnosis.status === 'issued' : state.projects[id]?.strategy.status === 'sent',
    }),
    [state.projects],
  );

  const decision = accessDecision(hash, role, ctx);
  const [routeNotice, setRouteNotice] = useState<{ text: string; at: string } | null>(null);

  const redirectTo = decision.kind === 'redirect' ? decision.to : null;
  const redirectNotice = decision.kind === 'redirect' ? decision.notice : undefined;
  useEffect(() => {
    if (redirectTo === null) return;
    if (redirectNotice) setRouteNotice({ text: redirectNotice, at: redirectTo });
    replaceHash(redirectTo);
  }, [redirectTo, redirectNotice, hash]);

  if (decision.kind === 'redirect') return null;

  const shownNotice = routeNotice && routeNotice.at === hash ? routeNotice.text : null;
  return (
    <AppShell route={decision.route} role={role} routeNotice={shownNotice} onDismissRouteNotice={() => setRouteNotice(null)}>
      <Screen route={decision.route} />
    </AppShell>
  );
}

export function App() {
  return (
    <StateProvider>
      <Routed />
    </StateProvider>
  );
}
