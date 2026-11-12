// Configuración por variables de entorno (contracts/env.md). Principio IX: NO hay modelo por defecto;
// la clave nunca se enumera ni se serializa.
import { z } from 'zod';

export type Stage = 'diagnosis' | 'strategy' | 'critic';
export type Reasoning = 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export class ConfigError extends Error {
  readonly category: 'no_model_configured' | 'bad_config';
  constructor(category: 'no_model_configured' | 'bad_config', message: string) {
    super(message);
    this.name = 'ConfigError';
    this.category = category;
  }
}

export interface Config {
  readonly port: number;
  readonly allowedOrigins: string[];
  readonly provider: 'openai' | 'fake';
  readonly keyConfigured: boolean;
  readonly models: Record<Stage, string | null>;
  readonly reasoning: Record<Stage, Reasoning | null>;
  readonly limits: {
    maxIterations: number;
    maxInputChars: number;
    maxOutputTokens: number;
    maxXlsxRows: number;
    maxFileBytes: number;
  };
  /** No enumerable: JSON.stringify y Object.entries no la ven. */
  getApiKey(): string | undefined;
}

const VARS: Record<Stage, { model: string; reasoning: string }> = {
  diagnosis: { model: 'OPENAI_MODEL_DIAGNOSTICO', reasoning: 'OPENAI_REASONING_DIAGNOSTICO' },
  strategy: { model: 'OPENAI_MODEL_ESTRATEGIA', reasoning: 'OPENAI_REASONING_ESTRATEGIA' },
  critic: { model: 'OPENAI_MODEL_CRITICO', reasoning: 'OPENAI_REASONING_CRITICO' },
};

const reasoningSchema = z.enum(['none', 'low', 'medium', 'high', 'xhigh', 'max']);
const posInt = (name: string, def: number, max = Number.MAX_SAFE_INTEGER) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (v === undefined) return def;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > max) {
        ctx.addIssue({ code: 'custom', message: `${name} debe ser un entero entre 1 y ${max}` });
        return z.NEVER;
      }
      return n;
    });

/** Lee y valida el entorno. Un valor vacío se trata como ausente (así funciona `.env.example` sin valores). */
export function loadConfig(env: Record<string, string | undefined>): Config {
  const e: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) e[k] = v === undefined || v.trim() === '' ? undefined : v.trim();

  const schema = z.object({
    PORT: posInt('PORT', 8787, 65535),
    MAX_ITERATIONS: posInt('MAX_ITERATIONS', 10),
    MAX_INPUT_CHARS: posInt('MAX_INPUT_CHARS', 120000),
    // Valor inicial provisional, NO VERIFICADO: se fija con la prueba de humo del lote C.
    MAX_OUTPUT_TOKENS: posInt('MAX_OUTPUT_TOKENS', 4096),
    MAX_XLSX_ROWS: posInt('MAX_XLSX_ROWS', 2000),
    MODEL_PROVIDER: z.enum(['openai', 'fake']).default('openai'),
    ALLOWED_ORIGINS: z.string().optional(),
    OPENAI_REASONING_DIAGNOSTICO: reasoningSchema.optional(),
    OPENAI_REASONING_ESTRATEGIA: reasoningSchema.optional(),
    OPENAI_REASONING_CRITICO: reasoningSchema.optional(),
  });
  const parsed = schema.safeParse(e);
  if (!parsed.success) {
    // Solo nombres de variable y motivo: nunca el valor recibido (podría ser una clave mal puesta).
    const detail = parsed.error.issues.map((i) => `${String(i.path[0] ?? 'configuración')}: ${i.message}`).join('; ');
    throw new ConfigError('bad_config', `Configuración inválida (${detail}).`);
  }
  const p = parsed.data;

  const origins = (p.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const key = e.OPENAI_API_KEY;
  const cfg = {
    port: p.PORT,
    allowedOrigins: origins,
    provider: p.MODEL_PROVIDER,
    keyConfigured: key !== undefined,
    models: {
      diagnosis: e[VARS.diagnosis.model] ?? null,
      strategy: e[VARS.strategy.model] ?? null,
      critic: e[VARS.critic.model] ?? null,
    },
    reasoning: {
      diagnosis: p.OPENAI_REASONING_DIAGNOSTICO ?? null,
      strategy: p.OPENAI_REASONING_ESTRATEGIA ?? null,
      critic: p.OPENAI_REASONING_CRITICO ?? null,
    },
    limits: {
      maxIterations: p.MAX_ITERATIONS,
      maxInputChars: p.MAX_INPUT_CHARS,
      maxOutputTokens: p.MAX_OUTPUT_TOKENS,
      maxXlsxRows: p.MAX_XLSX_ROWS,
      maxFileBytes: 26_214_400, // 25 MB, igual que FR-010
    },
  } as Config;
  Object.defineProperty(cfg, 'getApiKey', { value: () => key, enumerable: false });
  return cfg;
}

/** El modelo de la etapa, o un error que dice qué variable falta (no hay valor por defecto, principio IX). */
export function requireModel(config: Config, stage: Stage): string {
  const m = config.models[stage];
  if (!m) throw new ConfigError('no_model_configured', `Falta configurar el modelo de esta etapa: define la variable ${VARS[stage].model}.`);
  return m;
}
