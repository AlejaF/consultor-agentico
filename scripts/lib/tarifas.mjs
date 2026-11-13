// Tarifas por 1M de tokens (US$, contexto corto ≤ 272K) tomadas de specs/002-agente-real/research.md §3
// (páginas oficiales leídas el 2026-11-11 y re-verificadas el 2026-11-12). Si cambian, se actualizan AQUÍ y en research.md.
// No se cuenta la entrada en caché (estimación por arriba).
export const TARIFAS = {
  'gpt-6-luna': { input: 0.1, output: 0.5 },
  'gpt-6.1-terra': { input: 1, output: 5 },
  'gpt-6.1-sol': { input: 2, output: 10 },
  'gpt-6-astra': { input: 10, output: 50 },
};

export const SIN_TARIFA = 'costo no estimado: modelo sin tarifa';

/** Tarifa del modelo realmente usado. Acepta el ID exacto o una instantánea con fecha (`id-AAAA-MM-DD`). Nunca usa la de otro modelo. */
export function tarifaDe(model) {
  const id = String(model ?? '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
  return Object.hasOwn(TARIFAS, id) ? TARIFAS[id] : null;
}

/** Costo en US$ o `null` si el modelo no está en la tabla. `override` (ambos valores) lo fija la persona por entorno. */
export function estimarCosto(model, tokens, override = null) {
  const t = override ?? tarifaDe(model);
  if (!t) return null;
  return (tokens.input * t.input + tokens.output * t.output) / 1e6;
}

/** Tarifa indicada por la persona (RATE_INPUT_PER_M y RATE_OUTPUT_PER_M, las dos), o null. */
export function overrideDeEntorno(env) {
  const i = Number(env.RATE_INPUT_PER_M);
  const o = Number(env.RATE_OUTPUT_PER_M);
  return env.RATE_INPUT_PER_M && env.RATE_OUTPUT_PER_M && Number.isFinite(i) && Number.isFinite(o) ? { input: i, output: o } : null;
}

/** Línea de costo del resumen. */
export function lineaDeCosto(model, tokens, env = {}) {
  const override = overrideDeEntorno(env);
  const costo = estimarCosto(model, tokens, override);
  if (costo === null) return `- Costo: ${SIN_TARIFA} (\`${model}\` no está en la tabla de research.md)`;
  const t = override ?? tarifaDe(model);
  const origen = override ? 'tarifa indicada por ti en el entorno' : `tarifa de \`${model}\` según research.md`;
  return `- Costo estimado: US$ ${costo.toFixed(4)} (${origen}; por 1M: entrada ${t.input}, salida ${t.output}; **estimación**, contrástala con el panel de uso de la plataforma)`;
}
