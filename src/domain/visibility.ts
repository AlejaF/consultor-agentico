import type { Role } from '../app/router';

/**
 * Qué roles ven lo técnico del modo IA real (AG-009, AG-023): la traza del agente, la ficha técnica y los avisos de la corrida.
 * Son solo el Consultor y el Líder; la Empresa (`contacto`) y quien no ha entrado nunca los ven (ni siquiera en el DOM).
 */
const INTERNAL: readonly (Role | null)[] = ['consultor', 'lider'];

export const canSeeTrace = (role: Role | null): boolean => INTERNAL.includes(role);
export const canSeeTechSheet = (role: Role | null): boolean => INTERNAL.includes(role);
