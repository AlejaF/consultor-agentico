import type { Role } from '../app/router';

export interface Account {
  role: Role;
  displayName: string;
  subtitle: string;
}

/** Cuentas de demostración ficticias: sin credenciales (FR-001). */
export const ACCOUNTS: readonly Account[] = [
  { role: 'consultor', displayName: 'Consultor Demo', subtitle: 'Consultoría Demo · Equipo 1' },
  { role: 'lider', displayName: 'Líder Demo', subtitle: 'Programa de ejemplo · lidera 4 equipos' },
  { role: 'contacto', displayName: 'Contacto Demo', subtitle: 'Persona de contacto de la empresa cliente.' },
];
