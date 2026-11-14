import { DIAGNOSIS, DIMENSIONS, type Dimension } from '../data/diagnosis';
import { SEEDED_MATURITY } from '../data/projects';
import type { Team } from '../data/teams';
import type { Decision, PersistedState, RealMaturityLevel } from '../state/types';
import { usesAsSupport } from './review';

/** Rótulo del índice en modo IA real (AG-031): lo calcula el código, los niveles los propuso la IA. */
export const MATURITY_INDEX_LABEL = 'Calculado por código a partir de niveles propuestos por IA';
/** Nota del tablero del Líder cuando el promedio mezcla simulados y reales (AG-031 punto 12). */
export const MIX_NOTE = 'El promedio mezcla proyectos simulados (ilustrativos) y reales (estimados por IA)';

/** Índice ilustrativo y ficticio de un proyecto: el sembrado, o el de la plantilla (FR-058). Solo modo Simulado. */
export function maturityOf(projectId: string): number {
  return SEEDED_MATURITY[projectId] ?? DIAGNOSIS.maturityIndex;
}

type Backable = { id: string; verified: boolean };

/**
 * Hallazgos que respaldan HOY un nivel: los que cita y están aceptados o editados y verificados (misma lógica que FR-025 para la
 * estrategia). Un hallazgo pendiente, rechazado, NO VERIFICADO o inexistente no cuenta.
 */
export function backedFindings(level: Pick<RealMaturityLevel, 'derivesFrom'>, findings: readonly Backable[], decisions: Record<string, Decision>): string[] {
  return [...new Set(level.derivesFrom)].filter((id) => {
    const f = findings.find((x) => x.id === id);
    return f !== undefined && usesAsSupport(f.verified, decisions[id]?.state ?? 'pending');
  });
}

interface LevelBase {
  dimension: Dimension;
  justification: string;
  derivesFrom: string[];
}
export type LevelView = LevelBase &
  (
    | { status: 'backed'; level: number; basedOn: number; backing: string[] }
    /** Tiene hallazgos verificados citados, pero ninguno aceptado o editado: todos rechazados, o aún sin revisar. */
    | { status: 'no-backing'; reason: 'rejected' | 'pending'; basedOn: 0; backing: [] }
    /** El agente no halló hallazgos verificados en la dimensión: «Sin evidencia suficiente», NO VERIFICADO. */
    | { status: 'insufficient'; basedOn: 0; backing: [] }
  );

export interface MaturityEvaluation {
  /** Siempre las seis dimensiones, en el orden de la 001. */
  levels: LevelView[];
  /** Promedio de los niveles con respaldo vigente; null («—») si no hay ninguno. */
  index: number | null;
}

/** Texto «basado en N hallazgos» (AG-031 punto 7). */
export function basedOnText(n: number): string {
  return n === 1 ? 'basado en 1 hallazgo' : `basado en ${n} hallazgos`;
}

/** Evalúa los niveles guardados contra las decisiones ACTUALES: se recalcula en cada vista y nunca se guarda (AG-031). */
export function evaluateMaturity(maturity: readonly RealMaturityLevel[] | undefined, findings: readonly Backable[], decisions: Record<string, Decision>): MaturityEvaluation {
  const levels = DIMENSIONS.map(({ id }): LevelView => {
    const m = maturity?.find((x) => x.dimension === id);
    const base: LevelBase = { dimension: id, justification: m?.justification ?? '', derivesFrom: m?.derivesFrom ?? [] };
    if (!m || m.insufficient || m.level === null) return { ...base, status: 'insufficient', basedOn: 0, backing: [] };
    const backing = backedFindings(m, findings, decisions);
    if (backing.length > 0) return { ...base, status: 'backed', level: m.level, basedOn: backing.length, backing };
    const stillPending = m.derivesFrom.some((fid) => {
      const f = findings.find((x) => x.id === fid);
      return f !== undefined && f.verified && (decisions[fid]?.state ?? 'pending') === 'pending';
    });
    return { ...base, status: 'no-backing', reason: stillPending ? 'pending' : 'rejected', basedOn: 0, backing: [] };
  });
  const values = levels.flatMap((l) => (l.status === 'backed' ? [l.level] : []));
  return { levels, index: values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length };
}

/** Índice de madurez de un proyecto real: promedio de los niveles con respaldo vigente, o null. Lo calcula el código, nunca el modelo. */
export function maturityIndex(maturity: readonly RealMaturityLevel[] | undefined, findings: readonly Backable[], decisions: Record<string, Decision>): number | null {
  return evaluateMaturity(maturity, findings, decisions).index;
}

/**
 * Índice de madurez de un proyecto: el de su diagnóstico emitido, o null si no está emitido (FR-057).
 * Simulado: el valor ilustrativo sembrado (FR-058, sin cambios). IA real: el calculado por código a partir de los niveles (AG-031).
 */
export function projectMaturity(state: PersistedState, projectId: string): number | null {
  const ps = state.projects[projectId];
  if (ps?.diagnosis.status !== 'issued') return null;
  if (ps.mode === 'real') return maturityIndex(ps.real?.maturity, ps.real?.findings ?? [], ps.diagnosis.decisions);
  return maturityOf(projectId);
}

/** ¿El promedio del tablero mezcla al menos un proyecto Simulado y uno real con índice? (AG-031 punto 12) */
export function averageMixesModes(state: PersistedState): boolean {
  let simulated = 0;
  let real = 0;
  for (const [id, ps] of Object.entries(state.projects)) {
    if (projectMaturity(state, id) === null) continue;
    if (ps.mode === 'real') real += 1;
    else simulated += 1;
  }
  return simulated > 0 && real > 0;
}

function mean(values: (number | null)[]): number | null {
  const ok = values.filter((v): v is number => v !== null);
  return ok.length === 0 ? null : ok.reduce((a, b) => a + b, 0) / ok.length;
}

/** Madurez de un equipo: promedio de los diagnósticos emitidos de sus proyectos. */
export function teamMaturity(state: PersistedState, team: Pick<Team, 'projectIds'>): number | null {
  return mean(team.projectIds.map((id) => projectMaturity(state, id)));
}

/** Madurez promedio de todos los diagnósticos emitidos. */
export function averageMaturity(state: PersistedState): number | null {
  return mean(Object.keys(state.projects).map((id) => projectMaturity(state, id)));
}

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** El buscador coincide con el nombre del equipo o de cualquiera de sus empresas, sin mayúsculas ni tildes. */
export function teamMatches(query: string, teamName: string, companyNames: readonly string[]): boolean {
  const q = norm(query);
  if (q === '') return true;
  return [teamName, ...companyNames].some((n) => norm(n).includes(q));
}
