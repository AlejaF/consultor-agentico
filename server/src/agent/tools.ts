// Definición y ejecución de herramientas (AG-012): los argumentos se validan con esquemas ANTES de ejecutar;
// una llamada mal formada se devuelve al agente como `{ ok: false, error }` y se registra en la traza. Nunca lanza.
import { z } from 'zod';

export { z };
import { jsonSchemaOf, type ToolSpec } from '../model/client.ts';
import { summarizeArgs, type Trace } from './trace.ts';

export interface ToolOutcome {
  ok: boolean;
  /** Lo que ve el modelo (se serializa a JSON). */
  output: Record<string, unknown>;
  /** Una línea para la traza (sin texto largo de documentos). */
  summary: string;
}

export interface AgentTool<S extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  schema: S;
  run(args: z.infer<S>): ToolOutcome | Promise<ToolOutcome>;
}

export const specOf = (t: AgentTool): ToolSpec => ({ name: t.name, description: t.description, parameters: jsonSchemaOf(t.schema) });

export const PILARES = ['estrategia', 'infraestructura', 'datos', 'gobernanza', 'talento', 'cultura'] as const;

/** Valida y ejecuta una llamada del modelo. Siempre devuelve un resultado; los fallos van al agente y a la traza. */
export async function executeToolCall(tools: readonly AgentTool[], name: string, rawArguments: string, trace: Trace): Promise<ToolOutcome> {
  const fail = (error: string): ToolOutcome => {
    trace.add({ type: 'tool_error', name, error });
    return { ok: false, output: { ok: false, error }, summary: error };
  };
  const tool = tools.find((t) => t.name === name);
  if (!tool) return fail(`La herramienta «${name}» no existe. Herramientas disponibles: ${tools.map((t) => t.name).join(', ')}.`);
  let parsedJson: unknown;
  try {
    parsedJson = rawArguments.trim() === '' ? {} : JSON.parse(rawArguments);
  } catch {
    return fail('Los argumentos no son JSON válido. Envía un objeto JSON con los campos pedidos.');
  }
  const parsed = tool.schema.safeParse(parsedJson);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join('.') || 'argumentos'}: ${i.message}`).join('; ');
    return fail(`Argumentos no válidos (${detail}).`);
  }
  let outcome: ToolOutcome;
  try {
    outcome = await tool.run(parsed.data);
  } catch {
    return fail('La herramienta falló al ejecutarse.');
  }
  trace.add({ type: 'tool', name, args: summarizeArgs(parsedJson), resultSummary: outcome.summary, ok: outcome.ok });
  return outcome;
}
