// Nivel de madurez por dimensión (AG-031; contracts/agent-tools.md `registrar_nivel_madurez`).
// El MODELO propone un nivel entero de 1 a 5 por dimensión y cita los hallazgos verificados de los que deriva; este verificador
// (código determinista, sin modelo) rechaza cualquier respaldo inexistente, de otro pilar o NO verificado. NO existe ninguna
// herramienta ni campo para un índice global: lo calcula el código del navegador (`maturityIndex`), nunca el modelo.
import { z } from 'zod';
import { PILARES } from './tools.ts';

export type Dimension = (typeof PILARES)[number];
export const MAX_RETRIES_PER_LEVEL = 2;

export interface MaturityLevel {
  dimension: Dimension;
  /** Entero de 1 a 5, o null cuando la dimensión no tiene respaldo («Sin evidencia suficiente»). */
  level: number | null;
  insufficient: boolean;
  justification: string;
  derivesFrom: string[];
}

/** `.strict()`: un argumento extra (p. ej. `indice` o `promedio`) se rechaza como mal formado (AG-012). */
export const maturitySchema = z
  .object({
    dimension: z.enum(PILARES),
    nivel: z.number().int().min(1).max(5),
    justificacion: z.string().trim().min(3).max(300),
    derivaDe: z.array(z.string().trim().min(1).max(20)).min(1).max(10),
  })
  .strict();

export type VerifyResult = { ok: true } | { ok: false; error: string };

/** Todos los ids citados deben existir, ser del mismo pilar y estar verificados. */
export function verifyMaturityLevel(dimension: Dimension, ids: readonly string[], findings: readonly { id: string; dimension: string; verified: boolean }[]): VerifyResult {
  const problems: string[] = [];
  for (const id of new Set(ids)) {
    const f = findings.find((x) => x.id === id);
    if (!f) problems.push(`El hallazgo ${id} no existe.`);
    else if (f.dimension !== dimension) problems.push(`El hallazgo ${id} es del pilar ${f.dimension}, no de ${dimension}.`);
    else if (!f.verified) problems.push(`El hallazgo ${id} no está verificado.`);
  }
  if (problems.length === 0) return { ok: true };
  return { ok: false, error: `${problems.join(' ')} Cita solo hallazgos verificados de ese pilar, o no registres el nivel.` };
}

/** Siempre seis entradas, en el orden de los pilares: las dimensiones sin nivel válido las completa el código. */
export function completeMaturity(registered: ReadonlyMap<Dimension, MaturityLevel>): MaturityLevel[] {
  return PILARES.map((d) => registered.get(d) ?? { dimension: d, level: null, insufficient: true, justification: '', derivesFrom: [] });
}
