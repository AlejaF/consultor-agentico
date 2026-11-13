// Bucle genérico del agente (AG-008, AG-011, AG-012): llama al ModelClient, ejecuta las herramientas que pida y repite
// hasta que responda sin pedir más o se alcance un tope. Cualquier error del proveedor termina la corrida de inmediato:
// el bucle NUNCA reintenta una llamada (cero reintentos ante gasto, saldo, clave o límite de uso).
import { ModelError, type ConversationItem, type ModelClient, type Reasoning } from '../model/client.ts';
import { executeToolCall, specOf, type AgentTool } from './tools.ts';
import type { Trace } from './trace.ts';

export interface LoopOptions {
  client: ModelClient;
  model: string;
  reasoning?: Reasoning | null;
  system: string;
  userMessage: string;
  tools: readonly AgentTool[];
  trace: Trace;
  limits: { maxIterations: number; maxInputChars: number; maxOutputTokens: number };
  signal?: AbortSignal;
}

export interface LoopResult {
  status: 'done' | 'partial' | 'error' | 'aborted';
  /** Texto final del modelo, si lo hubo. */
  text?: string;
  error?: ModelError;
}

const size = (items: ConversationItem[], system: string) => system.length + items.reduce((n, it) => n + JSON.stringify(it).length, 0);
const isAbort = (e: unknown) => (e as { name?: string } | null)?.name === 'AbortError';

export async function runLoop(o: LoopOptions): Promise<LoopResult> {
  const { trace } = o;
  const specs = o.tools.map(specOf);
  const input: ConversationItem[] = [{ type: 'message', role: 'user', content: o.userMessage }];

  for (;;) {
    if (o.signal?.aborted) {
      trace.add({ type: 'warning', code: 'aborted', message: 'La corrida se cortó (conexión cerrada).' });
      return { status: 'aborted' };
    }
    if (trace.iterations >= o.limits.maxIterations) {
      trace.add({ type: 'warning', code: 'iteration_limit', message: `Se alcanzó el tope de ${o.limits.maxIterations} iteraciones; el resultado es parcial.` });
      return { status: 'partial' };
    }
    if (size(input, o.system) > o.limits.maxInputChars) {
      trace.add({ type: 'warning', code: 'input_truncated', message: `La entrada superó el tope de ${o.limits.maxInputChars} caracteres; el resultado es parcial.` });
      return { status: 'partial' };
    }

    trace.iterations += 1;
    let res;
    try {
      res = await o.client.respond(
        { model: o.model, ...(o.reasoning ? { reasoning: o.reasoning } : {}), system: o.system, input, tools: specs, maxOutputTokens: o.limits.maxOutputTokens },
        o.signal,
      );
    } catch (e) {
      if (isAbort(e) || o.signal?.aborted) {
        trace.add({ type: 'warning', code: 'aborted', message: 'La corrida se cortó (conexión cerrada).' });
        return { status: 'aborted' };
      }
      const err = e instanceof ModelError ? e : new ModelError('provider_unavailable', 'El proveedor de IA no respondió.');
      trace.add({ type: 'model_error', category: err.category, message: err.message });
      return { status: 'error', error: err };
    }

    trace.model = res.model;
    trace.tokens.input += res.usage.input;
    trace.tokens.output += res.usage.output;
    trace.tokens.reasoning += res.usage.reasoning ?? 0;
    input.push(...res.items);

    if (res.toolCalls.length === 0) return { status: 'done', ...(res.text !== undefined ? { text: res.text } : {}) };

    for (const call of res.toolCalls) {
      const outcome = await executeToolCall(o.tools, call.name, call.rawArguments, trace);
      input.push({ type: 'function_call_output', callId: call.id, output: JSON.stringify(outcome.output) });
    }
  }
}
