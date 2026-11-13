// POST /api/diagnosis/run (contracts/api.md). Una corrida por proyecto a la vez (409); si el cliente cierra la
// conexión se aborta la corrida y se descarta el resultado (AG-008, AG-009).
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DiagnosisFailure, runDiagnosis } from '../agent/diagnosis.ts';
import { errorBody, type ErrorCategory } from '../app.ts';
import { ConfigError, type Config } from '../config.ts';
import { ModelError, type ModelClient, type ModelErrorCategory } from '../model/client.ts';
import type { Store } from '../store.ts';

const bodySchema = z.object({ projectId: z.string().regex(/^[A-Za-z0-9-]{1,32}$/), empresa: z.string().max(200).optional() });

const HTTP: Record<ModelErrorCategory, number> = { spend_limit: 402, balance: 402, rate_limit: 429, usage_limit: 429, auth: 401, invalid_request: 502, model_unavailable: 502, access_denied: 502, provider_unavailable: 502 };

export function diagnosisRoutes(app: FastifyInstance, config: Config, store: Store, getClient: () => ModelClient): void {
  const running = new Set<string>();

  app.post('/api/diagnosis/run', async (req, reply) => {
    const body = bodySchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send(errorBody('bad_request', 'Falta un identificador de proyecto válido.'));
    const { projectId, empresa } = body.data;

    if (config.models.diagnosis === null) {
      return reply.code(400).send(errorBody('no_model_configured', 'Falta configurar el modelo de esta etapa: define la variable OPENAI_MODEL_DIAGNOSTICO.'));
    }
    if (config.provider === 'openai' && !config.keyConfigured) {
      return reply.code(401).send(errorBody('auth', 'Falta la clave de OpenAI o no es válida.'));
    }
    const files = store.searchableFiles(projectId);
    if (files.length === 0) return reply.code(422).send(errorBody('extraction_failed', 'No hay archivos con texto extraído en este proyecto. Sube y extrae documentos primero.'));
    if (running.has(projectId)) return reply.code(409).send(errorBody('bad_request', 'Ya hay una corrida en curso para este proyecto.'));

    running.add(projectId);
    const ctrl = new AbortController();
    // `reply.raw` (no `req.raw`): `req` emite «close» al terminar de leerse el cuerpo, no al cerrarse la conexión.
    const onClose = () => {
      if (!reply.raw.writableFinished) ctrl.abort();
    };
    reply.raw.on('close', onClose);
    try {
      const result = await runDiagnosis({ client: getClient(), config, files, ...(empresa ? { empresa } : {}), signal: ctrl.signal });
      if ('aborted' in result) return reply.hijack(); // conexión cerrada: se descarta el resultado
      return result;
    } catch (e) {
      if (e instanceof DiagnosisFailure && e.loop.error) {
        const me = e.loop.error;
        const retryable = me.category === 'rate_limit' || me.category === 'provider_unavailable';
        const base = errorBody(me.category as ErrorCategory, me.message, retryable);
        return reply.code(HTTP[me.category]).send({ error: { ...base.error, ...(me.retryAfterSeconds !== undefined ? { retryAfterSeconds: me.retryAfterSeconds } : {}), ...(me.providerStatus !== undefined ? { providerStatus: me.providerStatus } : {}), ...(me.providerCode !== undefined ? { providerCode: me.providerCode } : {}), trace: e.trace } });
      }
      if (e instanceof ConfigError) return reply.code(400).send(errorBody(e.category === 'no_model_configured' ? 'no_model_configured' : 'bad_request', e.message));
      if (e instanceof ModelError) return reply.code(HTTP[e.category]).send(errorBody(e.category, e.message));
      throw e;
    } finally {
      reply.raw.off('close', onClose);
      running.delete(projectId);
    }
  });
}
