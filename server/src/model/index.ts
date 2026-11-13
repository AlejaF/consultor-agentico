import type { Config } from '../config.ts';
import { ModelError, type ModelClient } from './client.ts';
import { createFakeClient } from './fake.ts';
import { createOpenAIClient } from './openai.ts';

/** Crea el cliente según `MODEL_PROVIDER`. El FALSO solo existe con `MODEL_PROVIDER=fake` (se anuncia en /api/health). */
export function createModelClient(config: Config): ModelClient {
  if (config.provider === 'fake') return createFakeClient([{ text: 'Cliente falso sin guion: no se registró ningún hallazgo.' }]);
  const key = config.getApiKey();
  if (!key) throw new ModelError('auth', 'Falta la clave de OpenAI o no es válida.');
  return createOpenAIClient({ apiKey: key });
}
