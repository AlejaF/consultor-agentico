import { countOf, plural } from './format';
import type { Decision } from '../state/types';

const stateOf = (decisions: Record<string, Decision>, id: string) => decisions[id]?.state ?? 'pending';

/** «N de M hallazgos revisados»: los ausentes cuentan como pendientes (FR-019). */
export function reviewProgress(findingIds: readonly string[], decisions: Record<string, Decision>) {
  return { reviewed: findingIds.filter((id) => stateOf(decisions, id) !== 'pending').length, total: findingIds.length };
}

/** Emitir exige todos revisados y al menos uno aceptado o editado (FR-021). */
export function canIssue(findingIds: readonly string[], decisions: Record<string, Decision>): boolean {
  return issueBlockReason(findingIds, decisions) === null;
}

/** Motivo por el que no se puede emitir, o null si se puede. */
export function issueBlockReason(findingIds: readonly string[], decisions: Record<string, Decision>): string | null {
  const { reviewed, total } = reviewProgress(findingIds, decisions);
  const missing = total - reviewed;
  if (missing > 0) return `${plural(missing, 'Falta', 'Faltan')} ${countOf(missing, 'hallazgo', 'hallazgos')} por revisar.`;
  const kept = findingIds.filter((id) => ['accepted', 'edited'].includes(stateOf(decisions, id))).length;
  if (kept === 0) return 'Debe haber al menos un hallazgo aceptado o editado.';
  return null;
}

/** Una edición vacía no se guarda (FR-020). */
export function isValidEdit(text: string): boolean {
  return text.trim().length > 0;
}
