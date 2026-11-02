import { useEffect, useMemo, useState } from 'react';
import { CONSULTOR_PROJECT_IDS } from '../data/projects';
import { Diagnosis } from '../screens/consultor/Diagnosis';
import { Evidence } from '../screens/consultor/Evidence';
import { Review } from '../screens/consultor/Review';
import { Strategy } from '../screens/consultor/Strategy';
import { Deliveries } from '../screens/lider/Deliveries';
import { Projects } from '../screens/consultor/Projects';
import { Summary } from '../screens/contacto/Summary';
import { Dashboard } from '../screens/lider/Dashboard';
import { DeliveryReview } from '../screens/lider/DeliveryReview';
import { Login } from '../screens/Login';
import { StateProvider, useAppState } from '../state/context';
import { UnsavedProvider } from '../state/unsaved';
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
    case 'consultor.diagnosis':
      return <Diagnosis projectId={route.params.projectId} />;
    case 'consultor.review':
      return <Review projectId={route.params.projectId} />;
    case 'consultor.strategy':
      return <Strategy projectId={route.params.projectId} />;
    case 'lider.deliveries':
      return <Deliveries />;
    case 'lider.delivery':
      return <DeliveryReview tipo={route.params.tipo as 'dx' | 'st'} projectId={route.params.projectId} />;
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
    <AppShell route={decision.route} role={decision.route.id === 'login' ? null : role} routeNotice={shownNotice} onDismissRouteNotice={() => setRouteNotice(null)}>
      <Screen route={decision.route} />
    </AppShell>
  );
}

export function App() {
  return (
    <StateProvider>
      <UnsavedProvider>
        <Routed />
      </UnsavedProvider>
    </StateProvider>
  );
}
