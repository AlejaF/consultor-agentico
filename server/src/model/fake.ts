// Cliente FALSO guionado (contracts/model-client.md): devuelve en orden lo que dice el guion, sin red ni gasto.
// Solo se instancia con MODEL_PROVIDER=fake (o desde las pruebas); /api/health lo anuncia con `fake: true`.
import { ModelError, type ModelClient, type ModelRequest, type ModelResponse } from './client.ts';

export type Step =
  | { toolCalls: Array<{ name: string; /** Objeto (se serializa) o cadena cruda (se envía tal cual, p. ej. JSON roto). */ arguments: unknown }>; usage?: { input: number; output: number }; /** Solo para probar que el bucle responde a una herramienta desconocida: salta la comprobación de «declarada». */ allowUndeclared?: boolean }
  | { text: string; usage?: { input: number; output: number } }
  | { throw: ModelError }
  /** Espera hasta que se aborte la señal (para probar el cierre de la conexión). */
  | { hang: true };

export interface FakeClient extends ModelClient {
  /** Solicitudes recibidas, en orden (para comprobar lo que se envió). */
  readonly requests: ModelRequest[];
  readonly calls: number;
  readonly aborted: boolean;
}

export function createFakeClient(script: Step[], opts: { model?: string } = {}): FakeClient {
  let i = 0;
  let aborted = false;
  const requests: ModelRequest[] = [];
  return {
    name: 'fake',
    requests,
    get calls() {
      return requests.length;
    },
    get aborted() {
      return aborted;
    },
    async respond(req, signal): Promise<ModelResponse> {
      requests.push(structuredClone(req));
      const step = script[i++];
      if (step === undefined) throw new Error('Cliente falso: el guion se agotó.');
      if ('throw' in step) throw step.throw;
      if ('hang' in step) {
        await new Promise<void>((_resolve, reject) => {
          const stop = () => {
            aborted = true;
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
          };
          if (signal?.aborted) return stop();
          signal?.addEventListener('abort', stop, { once: true });
        });
      }
      const model = opts.model ?? req.model;
      const usage = ('usage' in step && step.usage) || { input: 100, output: 20 };
      if ('text' in step) {
        return { items: [{ type: 'message', role: 'assistant', content: step.text }], toolCalls: [], text: step.text, usage, model };
      }
      if (!('toolCalls' in step)) throw new Error('Cliente falso: paso no válido.');
      const declared = new Set(req.tools.map((t) => t.name));
      const toolCalls = step.toolCalls.map((c, n) => {
        if (!step.allowUndeclared && !declared.has(c.name)) throw new Error(`Cliente falso: la herramienta «${c.name}» no está declarada en la solicitud.`);
        return { id: `call-${i}-${n}`, name: c.name, rawArguments: typeof c.arguments === 'string' ? c.arguments : JSON.stringify(c.arguments) };
      });
      return {
        items: toolCalls.map((c) => ({ type: 'function_call' as const, callId: c.id, name: c.name, arguments: c.rawArguments })),
        toolCalls,
        usage,
        model,
      };
    },
  };
}
