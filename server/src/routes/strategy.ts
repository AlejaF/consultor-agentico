// POST /api/strategy/run (contracts/api.md). Recibe SOLO hallazgos aceptados o editados y verificados (los filtra el navegador y el
// servicio vuelve a exigir que `state` sea accepted|edited, que haya al menos uno y que los ids sean únicos); no conserva nada.
// Mismas reglas que el diagnóstico: una corrida por proyecto (409), cierre de conexión aborta, errores del proveedor sin reintento.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { StrategyFailure, runStrategy, type StrategyInputFinding } from '../agent/strategy.ts';
import { PILARES } from '../agent/tools.ts';
import { errorBody, type ErrorCategory } from '../app.ts';
import { ConfigError, type Config } from '../config.ts';
import { ModelError, type ModelClient, type ModelErrorCategory } from '../model/client.ts';

const findingSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9-]{1,20}$/),
  dimension: z.enum(PILARES),
  title: z.string().max(200),
  text: z.string().max(4000),
  state: z.enum(['accepted', 'edited']),
  quotes: z.array(z.object({ file: z.string().max(200), location: z.unknown(), quote: z.string().max(2000) })).max(5),
});
const bodySchema = z.object({
  projectId: z.string().regex(/^[A-Za-z0-9-]{1,32}$/),
  empresa: z.string().max(200).optional(),
  findings: z.array(findingSchema).min(1).max(60),
});

const HTTP: Record<ModelErrorCategory, number> = { spend_limit: 402, balance: 402, rate_limit: 429, usage_limit: 429, auth: 401, invalid_request: 502, model_unavailable: 502, access_denied: 502, provider_unavailable: 502 };

export function strategyRoutes(app: FastifyInstance, config: Config, getClient: () => ModelClient): void {
  const running = new Set<string>();

  app.post('/api/strategy/run', async (req, reply) => {
    const body = bodySchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send(errorBody('bad_request', 'La estrategia necesita al menos un hallazgo aceptado o editado y verificado, con ids únicos.'));
    const { projectId, empresa, findings } = body.data;
    if (new Set(findings.map((f) => f.id)).size !== findings.length) return reply.code(400).send(errorBody('bad_request', 'Los ids de los hallazgos deben ser únicos.'));

    if (config.models.strategy === null) {
      return reply.code(400).send(errorBody('no_model_configured', 'Falta configurar el modelo de esta etapa: define la variable OPENAI_MODEL_ESTRATEGIA.'));
    }
    if (config.provider === 'openai' && !config.keyConfigured) {
      return reply.code(401).send(errorBody('auth', 'Falta la clave de OpenAI o no es válida.'));
    }
    if (running.has(projectId)) return reply.code(409).send(errorBody('bad_request', 'Ya hay una corrida en curso para este proyecto.'));

    running.add(projectId);
    const ctrl = new AbortController();
    const onClose = () => {
      if (!reply.raw.writableFinished) ctrl.abort();
    };
    reply.raw.on('close', onClose);
    try {
      const result = await runStrategy({ client: getClient(), config, findings: findings as StrategyInputFinding[], ...(empresa ? { empresa } : {}), signal: ctrl.signal });
      if ('aborted' in result) return reply.hijack();
      return result;
    } catch (e) {
      if (e instanceof StrategyFailure && e.loop.error) {
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
