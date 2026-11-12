import type { FastifyInstance } from 'fastify';
import type { Config } from '../config.ts';

export const VERSION = '0.1.0';

/** GET /api/health (contracts/api.md). Nunca devuelve la clave ni parte de ella. */
export function healthRoute(app: FastifyInstance, config: Config): void {
  app.get('/api/health', async () => ({
    ok: true,
    version: VERSION,
    keyConfigured: config.keyConfigured,
    models: config.models,
    limits: {
      maxIterations: config.limits.maxIterations,
      maxInputChars: config.limits.maxInputChars,
      maxFileBytes: config.limits.maxFileBytes,
    },
    fake: config.provider === 'fake',
  }));
}
