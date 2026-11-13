// Interfaz propia que aísla al proveedor (contracts/model-client.md). El bucle solo conoce esto.
import type { z } from 'zod';

export type ModelErrorCategory = 'spend_limit' | 'balance' | 'rate_limit' | 'auth' | 'usage_limit' | 'provider_unavailable';

/** Toda falla del proveedor se lanza así. El mensaje nunca contiene la clave ni el cuerpo de la solicitud. */
export class ModelError extends Error {
  readonly category: ModelErrorCategory;
  readonly retryAfterSeconds?: number;
  readonly providerCode?: string;
  constructor(category: ModelErrorCategory, message: string, extra: { retryAfterSeconds?: number; providerCode?: string } = {}) {
    super(message);
    this.name = 'ModelError';
    this.category = category;
    if (extra.retryAfterSeconds !== undefined) this.retryAfterSeconds = extra.retryAfterSeconds;
    if (extra.providerCode !== undefined) this.providerCode = extra.providerCode;
  }
}

/** Categorías tras las cuales el servicio NO reintenta nunca (AG-011). Las demás tampoco reintentan solas, pero la persona puede pulsar «Reintentar». */
export const NEVER_RETRY: readonly ModelErrorCategory[] = ['spend_limit', 'balance', 'auth', 'usage_limit'];

export type ConversationItem =
  | { type: 'message'; role: 'user' | 'assistant'; content: string }
  | { type: 'function_call'; callId: string; name: string; arguments: string }
  | { type: 'function_call_output'; callId: string; output: string }
  /** Elemento propio del proveedor (p. ej. razonamiento cifrado) que se devuelve tal cual en la siguiente llamada. */
  | { type: 'opaque'; raw: unknown };

export interface ToolSpec {
  name: string;
  description: string;
  /** Esquema JSON de los argumentos. */
  parameters: Record<string, unknown>;
}

export type Reasoning = 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface ModelRequest {
  model: string;
  reasoning?: Reasoning;
  system: string;
  input: ConversationItem[];
  tools: ToolSpec[];
  maxOutputTokens: number;
}

export interface ModelResponse {
  /** Lo que el modelo añade a la conversación. */
  items: ConversationItem[];
  /** Sin parsear: el bucle valida. */
  toolCalls: { id: string; name: string; rawArguments: string }[];
  /** Texto final si no pide herramientas. */
  text?: string;
  usage: { input: number; output: number; reasoning?: number };
  /** El modelo que respondió realmente. */
  model: string;
}

export interface ModelClient {
  readonly name: 'openai' | 'fake';
  respond(req: ModelRequest, signal?: AbortSignal): Promise<ModelResponse>;
}

/** Esquema JSON de un esquema zod, sin el campo `$schema`. */
export function jsonSchemaOf(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _omit, ...rest } = (schema as unknown as { toJSONSchema?: () => Record<string, unknown> }).toJSONSchema?.() ?? {};
  return rest;
}
