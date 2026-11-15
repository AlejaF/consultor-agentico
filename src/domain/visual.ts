// Capa visual (AG-033): lógica PURA de lo que se dibuja. No cambia ninguna regla de dominio: solo traduce valores ya calculados.
import { DIMENSIONS, type Dimension } from '../data/diagnosis';
import type { Decision, PersistedState } from '../state/types';
import { formatDecimal } from './format';
import { basedOnText, evaluateMaturity, type LevelView } from './maturity';

export const LOW_THRESHOLD = 2;
export const LOW_LABEL = 'Bajo (<2)';
export const SCALE_MAX = 5;

/** Lo que dibuja una barra. «empty» NUNCA lleva número ni ancho: solo la etiqueta (AG-033). */
export type BarView =
  | { kind: 'value'; value: number; percent: number; low: boolean; valueText: string; word: 'nivel' | 'promedio'; basedText: string }
  | { kind: 'empty'; label: 'Sin evidencia suficiente' | 'Sin respaldo vigente'; basedText: string };

const pct = (v: number) => Math.round((v / SCALE_MAX) * 10000) / 100;

/** Barra de una dimensión de un diagnóstico real. */
export function levelBar(l: LevelView): BarView {
  if (l.status === 'backed') return { kind: 'value', value: l.level, percent: pct(l.level), low: l.level < LOW_THRESHOLD, valueText: `${l.level} de ${SCALE_MAX}`, word: 'nivel', basedText: basedOnText(l.basedOn) };
  return { kind: 'empty', label: l.status === 'no-backing' ? 'Sin respaldo vigente' : 'Sin evidencia suficiente', basedText: basedOnText(0) };
}

const projectsText = (n: number) => (n === 1 ? 'basado en 1 proyecto' : `basado en ${n} proyectos`);

/** Barra de un promedio (tablero del Líder). Sin valor: vacía y con etiqueta. */
export function averageBar(value: number | null, projects: number): BarView {
  if (value === null) return { kind: 'empty', label: 'Sin evidencia suficiente', basedText: projectsText(0) };
  return { kind: 'value', value, percent: pct(value), low: value < LOW_THRESHOLD, valueText: `${formatDecimal(value)} de ${SCALE_MAX}`, word: 'promedio', basedText: projectsText(projects) };
}

/** Cuánto se llena cada uno de los 5 segmentos del nivel general (0 a 1). */
export function segmentFills(index: number | null): number[] {
  return Array.from({ length: SCALE_MAX }, (_, i) => (index === null ? 0 : Math.max(0, Math.min(1, index - i))));
}

export interface ReviewCounts {
  total: number;
  accepted: number;
  edited: number;
  /** Aceptados o editados. */
  adopted: number;
  rejected: number;
  pending: number;
  /** Hallazgos NO VERIFICADO (independiente de la decisión). */
  unverified: number;
}

/** Cifras de la revisión a partir de las decisiones ya guardadas (no cambia `reviewProgress` ni `canIssue`). */
export function reviewStats(findings: readonly { id: string; verified: boolean }[], decisions: Record<string, Decision>): ReviewCounts {
  const states = findings.map((f) => decisions[f.id]?.state ?? 'pending');
  const n = (s: string) => states.filter((x) => x === s).length;
  const accepted = n('accepted');
  const edited = n('edited');
  return { total: findings.length, accepted, edited, adopted: accepted + edited, rejected: n('rejected'), pending: n('pending'), unverified: findings.filter((f) => !f.verified).length };
}

/** ¿Hay al menos un proyecto REAL con diagnóstico emitido? Solo entonces el tablero muestra el promedio por pilar (AG-033; la 001 lo excluyó, FR-057 c). */
export function hasRealIssued(state: PersistedState): boolean {
  return Object.values(state.projects).some((ps) => ps.mode === 'real' && ps.diagnosis.status === 'issued');
}

/** Promedio por pilar de los niveles con respaldo vigente de los proyectos REALES con diagnóstico emitido. Sin datos: value null. */
export function pillarAverages(state: PersistedState): { dimension: Dimension; value: number | null; projects: number }[] {
  const per = new Map<Dimension, number[]>(DIMENSIONS.map((d) => [d.id, []]));
  for (const ps of Object.values(state.projects)) {
    if (ps.mode !== 'real' || ps.diagnosis.status !== 'issued') continue;
    for (const l of evaluateMaturity(ps.real?.maturity, ps.real?.findings ?? [], ps.diagnosis.decisions).levels) {
      if (l.status === 'backed') per.get(l.dimension)!.push(l.level);
    }
  }
  return DIMENSIONS.map(({ id }) => {
    const v = per.get(id)!;
    return { dimension: id, value: v.length === 0 ? null : v.reduce((a, b) => a + b, 0) / v.length, projects: v.length };
  });
}
