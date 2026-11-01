export function SimBadge() {
  return <span className="badge badge-sim">Simulada</span>;
}

export function UnverifiedBadge() {
  return <span className="badge badge-unverified">NO VERIFICADO</span>;
}

export type Status = 'completado' | 'en-curso' | 'pendiente' | 'rechazado';

const LABEL: Record<Status, [string, string]> = {
  completado: ['Completado', 'badge-ok'],
  'en-curso': ['En curso', 'badge-warn'],
  pendiente: ['Pendiente', 'badge-pending'],
  rechazado: ['Rechazado', 'badge-danger'],
};

/** Estado con texto, no solo con color. */
export function StatusBadge({ status }: { status: Status }) {
  const [text, cls] = LABEL[status];
  return <span className={`badge ${cls}`}>{text}</span>;
}
