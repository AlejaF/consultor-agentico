# Contrato: `ModelClient` y errores normalizados

Interfaz propia que aísla al proveedor; el bucle solo conoce esto.

```ts
interface ModelClient {
  readonly name: string;                         // 'openai' | 'fake'
  respond(req: ModelRequest, signal?: AbortSignal): Promise<ModelResponse>;
}

interface ModelRequest {
  model: string;
  reasoning?: 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  system: string;
  input: ConversationItem[];                     // mensajes, llamadas a función y sus resultados
  tools: ToolSpec[];                             // nombre, descripción y esquema JSON de argumentos
  maxOutputTokens: number;
}

type ModelResponse = {
  items: ConversationItem[];                     // lo que el modelo añade
  toolCalls: { id: string; name: string; rawArguments: string }[];   // sin parsear: el bucle valida
  text?: string;                                 // texto final si no pide herramientas
  usage: { input: number; output: number; reasoning?: number };
  model: string;                                 // el que respondió realmente
};
```

**Errores**: toda falla se lanza como `ModelError { category, message, retryAfterSeconds?, providerCode? }` con las categorías de [api.md](./api.md). La implementación OpenAI:
- construye el cliente con **`maxRetries: 0`** (sin reintentos del SDK; AG-011),
- usa `store: false`,
- traduce `error.code` (no solo `type`) a la categoría,
- nunca incluye la clave ni el cuerpo de la solicitud en el mensaje.

**Cliente FALSO** (`fake.ts`): se construye con un guion `Step[]` (`{ toolCalls }`, `{ text }` o `{ throw: ModelError }`); devuelve en orden y falla si se agota o si se llama con una herramienta no declarada. Solo se instancia si `MODEL_PROVIDER=fake`, y el servicio lo anuncia en `/api/health` (`fake: true`).

**Garantías del bucle** (probadas con el FALSO):
1. Argumentos que no son JSON o no cumplen el esquema → se devuelve un resultado de error a la herramienta y se registra en la traza; no lanza excepción.
2. Nombre de herramienta desconocido → igual que arriba.
3. `MAX_ITERATIONS` alcanzado → termina con resultado parcial + aviso.
4. `ModelError` de categoría `spend_limit`, `balance`, `auth`, `usage_limit` → termina inmediatamente, **cero reintentos**.
5. El tamaño de entrada acumulado se comprueba antes de cada llamada; si lo supera, termina con resultado parcial + aviso.
6. El `AbortSignal` corta la corrida.
