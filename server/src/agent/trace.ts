// Traza del agente (AG-009; data-model «Traza»): qué herramientas usó, qué verificaciones fallaron, modelo, tokens y errores.
import type { ModelErrorCategory } from '../model/client.ts';

export type TraceStep =
  | { type: 'tool'; name: string; args: unknown; resultSummary: string; ok: boolean }
  | { type: 'verification'; findingTempId: string; ok: boolean; reason?: string; resolution?: 'corregida' | 'descartada' | 'no_verificado' }
  | { type: 'tool_error'; name: string; error: string }
  | { type: 'warning'; code: 'iteration_limit' | 'input_truncated' | 'injection_suspected' | 'aborted'; message: string }
  | { type: 'model_error'; category: ModelErrorCategory; message: string };

export interface Trace {
  readonly steps: TraceStep[];
  model: string | null;
  iterations: number;
  tokens: { input: number; output: number; reasoning: number };
  add(step: TraceStep): void;
  toolCounts(): Record<string, number>;
  verificationFailures(): number;
  errors(): Array<{ category: string; message: string }>;
}

const MAX_ARG = 200;

/** Recorta cadenas largas de los argumentos (la traza no debe arrastrar fragmentos enormes). */
export function summarizeArgs(v: unknown): unknown {
  if (typeof v === 'string') return v.length > MAX_ARG ? `${v.slice(0, MAX_ARG)}…` : v;
  if (Array.isArray(v)) return v.map(summarizeArgs);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, summarizeArgs(x)]));
  return v;
}

export function createTrace(): Trace {
  const steps: TraceStep[] = [];
  return {
    steps,
    model: null,
    iterations: 0,
    tokens: { input: 0, output: 0, reasoning: 0 },
    add: (s) => void steps.push(s),
    toolCounts() {
      const c: Record<string, number> = {};
      for (const s of steps) if (s.type === 'tool' || s.type === 'tool_error') c[s.name] = (c[s.name] ?? 0) + 1;
      return c;
    },
    verificationFailures: () => steps.filter((s) => s.type === 'verification' && !s.ok).length,
    errors: () => steps.flatMap((s) => (s.type === 'model_error' ? [{ category: s.category, message: s.message }] : s.type === 'tool_error' ? [{ category: 'tool_error', message: s.error }] : [])),
  };
}
