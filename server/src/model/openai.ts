// Cliente OpenAI (Responses API, herramientas de tipo función). Sin reintentos del SDK (AG-011), `store: false`,
// errores traducidos por `error.code` y mensajes fijos: nunca se incluye la clave ni el cuerpo de la solicitud.
import OpenAI from 'openai';
import { ModelError, type ConversationItem, type ModelClient, type ModelRequest, type ModelResponse } from './client.ts';

const SPEND = new Set(['organization_spend_limit_exceeded', 'project_spend_limit_exceeded']);
const BALANCE = new Set(['credit_balance_exhausted', 'insufficient_quota']);

interface ProviderErrorLike {
  status?: number;
  message?: unknown;
  code?: unknown;
  type?: unknown;
  headers?: unknown;
  error?: { code?: unknown; type?: unknown };
}

function headerValue(headers: unknown, name: string): string | undefined {
  if (headers && typeof (headers as Headers).get === 'function') return (headers as Headers).get(name) ?? undefined;
  if (headers && typeof headers === 'object') {
    const v = (headers as Record<string, unknown>)[name];
    return typeof v === 'string' ? v : undefined;
  }
  return undefined;
}

const MAX_PROVIDER_MESSAGE = 300;

/** Mensaje del proveedor apto para mostrar: sin la clave (exacta o con forma de clave), en una línea y acotado. */
export function sanitizeProviderMessage(raw: unknown, apiKey?: string): string {
  let t = typeof raw === 'string' ? raw : '';
  if (apiKey && apiKey.length >= 8) t = t.split(apiKey).join('[clave omitida]');
  t = t.replace(/sk-[A-Za-z0-9_*-]{6,}/g, '[clave omitida]').replace(/\s+/g, ' ').trim();
  return t.length > MAX_PROVIDER_MESSAGE ? `${t.slice(0, MAX_PROVIDER_MESSAGE)}…` : t;
}

/**
 * Traduce un error del SDK (o de red) a `ModelError`. Decide por `error.code` y, si falta, por `type` o por el estado HTTP.
 * `apiKey` (opcional) se usa solo para tachar la clave de los mensajes del proveedor.
 */
export function toModelError(err: unknown, apiKey?: string): ModelError {
  if (err instanceof ModelError) return err;
  const e = (err ?? {}) as ProviderErrorLike;
  const codeRaw = e.code ?? e.error?.code;
  const typeRaw = e.type ?? e.error?.type;
  const code = typeof codeRaw === 'string' ? codeRaw : undefined;
  const type = typeof typeRaw === 'string' ? typeRaw : undefined;
  const extra = code ? { providerCode: code } : {};

  if (code && SPEND.has(code)) return new ModelError('spend_limit', 'Se alcanzó el límite de gasto de tu cuenta o proyecto de OpenAI. Súbelo o espera al próximo periodo.', extra);
  if ((code && BALANCE.has(code)) || type === 'insufficient_quota') return new ModelError('balance', 'Se agotó el saldo prepago de tu cuenta de OpenAI. Agrega crédito.', extra);
  if (code === 'organization_usage_limit_exceeded') return new ModelError('usage_limit', 'Se alcanzó un límite de uso fijado por OpenAI.', extra);
  if (code === 'rate_limit_exceeded' || e.status === 429) {
    const ra = Number(headerValue(e.headers, 'retry-after'));
    return new ModelError('rate_limit', 'Hay demasiadas solicitudes; reintenta en unos segundos.', { ...extra, ...(Number.isFinite(ra) && ra > 0 ? { retryAfterSeconds: Math.ceil(ra) } : {}) });
  }
  // Clave: 401, código de clave inválida, o 403 sin código (se conserva el comportamiento anterior).
  if (e.status === 401 || code === 'invalid_api_key' || (e.status === 403 && !code)) return new ModelError('auth', 'Falta la clave de OpenAI o no es válida.', extra);

  const status = typeof e.status === 'number' ? e.status : undefined;
  const detail = () => {
    const raw = e.error && typeof e.error === 'object' && 'message' in e.error ? (e.error as { message?: unknown }).message : e.message;
    // El SDK antepone «<estado> » al mensaje; se quita para no repetirlo.
    return sanitizeProviderMessage(raw, apiKey).replace(/^\d{3}\s+/, '');
  };
  const describe = (lead: string, hint = '') => {
    const d = detail();
    return `${lead} (HTTP ${status ?? '?'}${code ? `, código «${code}»` : ''})${d ? `: ${d}` : '.'}${hint}`;
  };
  const withStatus = status !== undefined ? { ...extra, providerStatus: status } : extra;

  // Modelo inexistente (404) o no permitido en el proyecto (403 con código de modelo).
  if (status === 404 || code === 'model_not_found') {
    return new ModelError('model_unavailable', describe('El modelo no está disponible', ' Revisa el nombre en OPENAI_MODEL_DIAGNOSTICO y que tu proyecto tenga acceso.'), withStatus);
  }
  // Otro 403 con código real (país no admitido, permisos de la clave, etc.).
  if (status === 403) return new ModelError('access_denied', describe('OpenAI negó el acceso'), withStatus);
  // Cualquier otro 4xx (400, 413, 422…) es un problema de la solicitud, no de red: no se reintenta. 408 y 409 son transitorios.
  if (status !== undefined && status >= 400 && status < 500 && status !== 408 && status !== 409) {
    return new ModelError('invalid_request', describe('OpenAI rechazó la solicitud'), withStatus);
  }
  return new ModelError('provider_unavailable', 'El proveedor de IA no respondió.', extra);
}

export interface OpenAIClientOptions {
  apiKey: string;
  /** Solo para pruebas (cliente HTTP sustituible). */
  fetch?: typeof fetch;
}

type Json = Record<string, unknown>;

function toInput(items: ConversationItem[]): Json[] {
  return items.map((it): Json => {
    switch (it.type) {
      case 'message':
        return { type: 'message', role: it.role, content: it.content };
      case 'function_call':
        return { type: 'function_call', call_id: it.callId, name: it.name, arguments: it.arguments };
      case 'function_call_output':
        return { type: 'function_call_output', call_id: it.callId, output: it.output };
      case 'opaque':
        return it.raw as Json;
    }
  });
}

export function createOpenAIClient(opts: OpenAIClientOptions): ModelClient {
  const sdk = new OpenAI({ apiKey: opts.apiKey, maxRetries: 0, ...(opts.fetch ? { fetch: opts.fetch } : {}) });
  return {
    name: 'openai',
    async respond(req: ModelRequest, signal?: AbortSignal): Promise<ModelResponse> {
      let res;
      try {
        res = await sdk.responses.create(
          {
            model: req.model,
            instructions: req.system,
            input: toInput(req.input) as never,
            tools: req.tools.map((t) => ({ type: 'function' as const, name: t.name, description: t.description, parameters: t.parameters, strict: false })),
            max_output_tokens: req.maxOutputTokens,
            store: false,
            // Con store:false el razonamiento viaja cifrado y se devuelve tal cual en la siguiente vuelta.
            include: ['reasoning.encrypted_content'],
            ...(req.reasoning ? { reasoning: { effort: req.reasoning } } : {}),
          },
          signal ? { signal } : undefined,
        );
      } catch (e) {
        if (signal?.aborted || (e as { name?: string })?.name === 'AbortError') throw e;
        throw toModelError(e, opts.apiKey);
      }
      const items: ConversationItem[] = [];
      const toolCalls: ModelResponse['toolCalls'] = [];
      let text = '';
      for (const o of res.output as unknown as Json[]) {
        if (o.type === 'function_call') {
          const call = { id: String(o.call_id), name: String(o.name), rawArguments: String(o.arguments ?? '') };
          toolCalls.push(call);
          items.push({ type: 'function_call', callId: call.id, name: call.name, arguments: call.rawArguments });
        } else if (o.type === 'message') {
          const t = ((o.content as Json[] | undefined) ?? []).map((c) => (c.type === 'output_text' ? String(c.text ?? '') : '')).join('');
          text += t;
          items.push({ type: 'message', role: 'assistant', content: t });
        } else if (o.type === 'reasoning') {
          items.push({ type: 'opaque', raw: o });
        }
      }
      const u = res.usage;
      return {
        items,
        toolCalls,
        ...(toolCalls.length === 0 ? { text } : {}),
        usage: { input: u?.input_tokens ?? 0, output: u?.output_tokens ?? 0, ...(u?.output_tokens_details?.reasoning_tokens !== undefined ? { reasoning: u.output_tokens_details.reasoning_tokens } : {}) },
        model: res.model,
      };
    },
  };
}
