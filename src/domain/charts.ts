// Gráficos (AG-035, lote H3): lógica PURA de lo que se dibuja. Solo traduce estado ya existente; no cambia ninguna regla de dominio.
// Honestidad: lo que no tiene dato queda vacío o aparte, nunca con un número inventado.
import { DIMENSIONS, type Dimension } from '../data/diagnosis';
import type { Decision } from '../state/types';
import type { Stage } from './progress';
import { usesAsSupport } from './review';
import type { ReviewCounts } from './visual';

type DecisionMap = Record<string, Decision>;
const stateOf = (decisions: DecisionMap, id: string) => decisions[id]?.state ?? 'pending';
/** ¿El hallazgo está vigente? Aceptado o editado y verificado (misma regla que la estrategia y la madurez). */
const isCurrent = (f: { id: string; verified: boolean }, decisions: DecisionMap) => usesAsSupport(f.verified, stateOf(decisions, f.id));

// ---------- Cobertura de evidencia: pilar × documento ----------
export interface CoverageRow {
  dimension: Dimension;
  label: string;
  /** Una celda por documento (mismo orden que `docs`). 0 = «sin evidencia»: se dibuja vacía, sin número. */
  cells: number[];
  total: number;
  empty: boolean;
}
export interface Coverage {
  docs: string[];
  rows: CoverageRow[];
  colTotals: number[];
  total: number;
}
export function evidenceCoverage(
  findings: readonly { id: string; dimension: Dimension; verified: boolean; realCitations?: readonly { file: string }[] }[],
  decisions: DecisionMap,
): Coverage {
  const docs: string[] = [];
  for (const f of findings) for (const c of f.realCitations ?? []) if (!docs.includes(c.file)) docs.push(c.file);
  const rows = DIMENSIONS.map(({ id, label }): CoverageRow => {
    const cells = docs.map((doc) => findings.filter((f) => f.dimension === id && isCurrent(f, decisions) && (f.realCitations ?? []).some((c) => c.file === doc)).length);
    const total = findings.filter((f) => f.dimension === id && isCurrent(f, decisions)).length;
    return { dimension: id, label, cells, total, empty: cells.every((n) => n === 0) };
  });
  const colTotals = docs.map((_, i) => rows.reduce((a, r) => a + r.cells[i]!, 0));
  return { docs, rows, colTotals, total: rows.reduce((a, r) => a + r.total, 0) };
}

// ---------- Barras segmentadas (partes de un total) ----------
export interface Part<K extends string = string> {
  key: K;
  label: string;
  n: number;
  percent: number;
}
const toParts = <K extends string>(defs: readonly { key: K; label: string; n: number }[], total: number, keepEmpty: boolean): Part<K>[] =>
  defs.filter((d) => keepEmpty || d.n > 0).map((d) => ({ ...d, percent: total === 0 ? 0 : Math.round((d.n / total) * 1000) / 10 }));

export type ReviewKey = 'accepted' | 'edited' | 'rejected' | 'pending';
/** Estado de la revisión: cuatro partes que suman el total. NO VERIFICADO se cuenta aparte (es independiente de la decisión). */
export function reviewSegments(s: ReviewCounts): { total: number; parts: Part<ReviewKey>[]; unverified: number } {
  return {
    total: s.total,
    unverified: s.unverified,
    parts: toParts<ReviewKey>(
      [
        { key: 'accepted', label: 'Aceptados', n: s.accepted },
        { key: 'edited', label: 'Editados', n: s.edited },
        { key: 'rejected', label: 'Rechazados', n: s.rejected },
        { key: 'pending', label: 'Pendientes', n: s.pending },
      ],
      s.total,
      true,
    ),
  };
}

export type RiskKey = 'alto' | 'medio' | 'bajo';
export function riskLevelSegments(risks: readonly { level?: RiskKey | undefined }[]): { total: number; parts: Part<RiskKey>[]; noLevel: number } {
  const n = (l: RiskKey) => risks.filter((r) => r.level === l).length;
  return {
    total: risks.length,
    noLevel: risks.filter((r) => r.level === undefined).length,
    parts: toParts<RiskKey>([{ key: 'alto', label: 'Alto', n: n('alto') }, { key: 'medio', label: 'Medio', n: n('medio') }, { key: 'bajo', label: 'Bajo', n: n('bajo') }], risks.length, false),
  };
}

const STAGES: readonly Stage[] = ['Evidencia', 'Diagnóstico', 'Estrategia'];
export function stageSegments(stages: readonly Stage[]): { total: number; parts: Part<Stage>[] } {
  return { total: stages.length, parts: toParts<Stage>(STAGES.map((s) => ({ key: s, label: s, n: stages.filter((x) => x === s).length })), stages.length, false) };
}

// ---------- Procedencia: elemento × hallazgo ----------
export interface Provenance {
  cols: { id: string; title: string }[];
  rows: { id: string; label: string; kind: 'riesgo' | 'fase'; marks: boolean[] }[];
  /** Hallazgos vigentes que ninguna acción usa. */
  unused: string[];
}
export function provenanceMatrix(
  items: readonly { id: string; label: string; kind: 'riesgo' | 'fase'; derivedFrom: readonly string[] }[],
  findings: readonly { id: string; title?: string; verified: boolean }[],
  decisions: DecisionMap,
): Provenance {
  const current = findings.filter((f) => ['accepted', 'edited'].includes(stateOf(decisions, f.id)));
  const cols = current.map((f) => ({ id: f.id, title: f.title ?? f.id }));
  const rows = items.map((it) => ({ id: it.id, label: it.label, kind: it.kind, marks: cols.map((c) => it.derivedFrom.includes(c.id)) }));
  return { cols, rows, unused: cols.filter((c) => !items.some((it) => it.derivedFrom.includes(c.id))).map((c) => c.id) };
}

// ---------- Madurez por proyecto ----------
export interface MaturityBar {
  id: string;
  name: string;
  value: number;
  percent: number;
  /** Simulado: ilustrativo (gris con rótulo). Real: color de acento. */
  illustrative: boolean;
}
export function maturityByProject(rows: readonly { id: string; name: string; mode: 'real' | 'simulated'; index: number | null }[]): { bars: MaturityBar[]; withoutLevel: { id: string; name: string }[] } {
  const bars = rows
    .flatMap((r) => (r.index === null ? [] : [{ id: r.id, name: r.name, value: r.index, percent: Math.round((r.index / 5) * 10000) / 100, illustrative: r.mode === 'simulated' }]))
    .sort((a, b) => b.value - a.value);
  return { bars, withoutLevel: rows.filter((r) => r.index === null).map((r) => ({ id: r.id, name: r.name })) };
}

// ---------- Resumen de la traza ----------
export function traceSummary(
  run: { iterations?: number; tokens?: { total: number }; verificationFailures?: number; toolCounts?: Record<string, number>; partial?: boolean },
  cap: number | null,
) {
  const iterations = run.iterations ?? 0;
  return {
    tools: Object.entries(run.toolCounts ?? {})
      .map(([name, n]) => ({ name, n }))
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)),
    iterations,
    cap,
    iterationsPercent: cap === null || cap <= 0 ? null : Math.min(100, Math.round((iterations / cap) * 100)),
    failures: run.verificationFailures ?? 0,
    tokens: run.tokens?.total ?? null,
    partial: run.partial === true,
  };
}

// ---------- Ruta por horizonte ----------
export function groupByHorizon<T extends { horizon?: string | undefined }>(items: readonly T[]): { horizon: string; items: T[] }[] {
  const out: { horizon: string; items: T[] }[] = [];
  for (const it of items) {
    const h = it.horizon?.trim() || 'Sin horizonte';
    const col = out.find((c) => c.horizon === h);
    if (col) col.items.push(it);
    else out.push({ horizon: h, items: [it] });
  }
  return out;
}
