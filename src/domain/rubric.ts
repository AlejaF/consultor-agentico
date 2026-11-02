import { CRITERION_IDS } from '../data/rubric';
import { plural } from './format';

export type Levels = Record<string, number>;

/** Media aritmética exacta de los niveles de los criterios. */
export function average(levels: Levels): number {
  const values = CRITERION_IDS.map((id) => levels[id]);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

const validLevel = (n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5;

/** Motivo por el que no se puede guardar, o null si los 4 criterios tienen nivel (FR-030). El comentario es opcional. */
export function gradingBlockReason(levels: Levels): string | null {
  const missing = CRITERION_IDS.filter((id) => !validLevel(levels[id])).length;
  if (missing === 0) return null;
  const falta =
    missing === CRITERION_IDS.length
      ? `Elige un nivel de 1 a 5 en los ${CRITERION_IDS.length} criterios.`
      : `${plural(missing, 'Falta', 'Faltan')} ${missing} ${plural(missing, 'criterio', 'criterios')} por calificar.`;
  return `${falta} El comentario es opcional.`;
}

export function isGradingComplete(levels: Levels): boolean {
  return gradingBlockReason(levels) === null;
}

/** Media de los promedios de todas las calificaciones guardadas (de ejemplo y de la sesión); null si no hay ninguna. */
export function averageOfGradings(gradings: Record<string, { average: number }>): number | null {
  const all = Object.values(gradings);
  return all.length === 0 ? null : all.reduce((a, g) => a + g.average, 0) / all.length;
}
