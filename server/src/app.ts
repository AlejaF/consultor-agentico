// Construcción del servicio local. Solo escucha en 127.0.0.1 (principio II): el servidor y la clave no se
// despliegan; viven únicamente en el equipo de la persona.
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config.ts';
import type { Logger } from './log.ts';
import { evidenceRoutes } from './routes/evidence.ts';
import { healthRoute } from './routes/health.ts';
import { createStore, type Store } from './store.ts';

export const HOST = '127.0.0.1' as const;

declare module 'fastify' {
  interface FastifyInstance {
    allowedHosts: Set<string>;
  }
}

export type ErrorCategory =
  | 'spend_limit'
  | 'balance'
  | 'rate_limit'
  | 'auth'
  | 'usage_limit'
  | 'provider_unavailable'
  | 'no_model_configured'
  | 'input_too_large'
  | 'bad_request'
  | 'extraction_failed'
  | 'internal';

/** Formato único de error (contracts/api.md). */
export function errorBody(category: ErrorCategory, message: string, retryable = false) {
  return { error: { category, message, retryable } };
}

export async function buildServer(config: Config, logger: Logger, store: Store = createStore()): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, bodyLimit: 1_048_576 });

  // Hosts aceptados: el propio servicio y los de los orígenes permitidos (el proxy de Vite conserva el Host del navegador).
  const allowedHosts = new Set<string>([`127.0.0.1:${config.port}`, `localhost:${config.port}`]);
  for (const o of config.allowedOrigins) {
    try {
      allowedHosts.add(new URL(o).host.toLowerCase());
    } catch {
      /* origen mal escrito: la validación de configuración ya lo avisa en el arranque */
    }
  }
  app.decorate('allowedHosts', allowedHosts);

  // Defensa contra DNS rebinding y contra orígenes ajenos. Va ANTES del plugin de CORS.
  app.addHook('onRequest', async (req, reply) => {
    const host = String(req.headers.host ?? '').toLowerCase();
    if (!app.allowedHosts.has(host)) {
      return reply.code(403).send(errorBody('bad_request', 'Host no permitido.'));
    }
    const origin = req.headers.origin;
    if (origin !== undefined && !config.allowedOrigins.includes(origin)) {
      return reply.code(403).send(errorBody('bad_request', 'Origen no permitido.'));
    }
  });

  await app.register(cors, { origin: config.allowedOrigins, methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] });
  await app.register(multipart, {
    // throwFileSizeLimit: false → un archivo demasiado grande se marca como truncado y se rechaza solo a él.
    throwFileSizeLimit: false,
    limits: { fileSize: config.limits.maxFileBytes, files: 20, fields: 10, fieldNameSize: 100, headerPairs: 100 },
  });

  app.addHook('onResponse', async (req, reply) => {
    logger.request({ method: req.method, path: req.url, status: reply.statusCode, durationMs: reply.elapsedTime });
  });

  app.setNotFoundHandler((_req, reply) => reply.code(404).send(errorBody('bad_request', 'Ruta no encontrada.')));
  app.setErrorHandler((err, _req, reply) => {
    const code = (err as { statusCode?: number }).statusCode ?? 500;
    if (code === 413) return reply.code(413).send(errorBody('input_too_large', 'El archivo o la entrada es demasiado grande.'));
    if (code >= 400 && code < 500) return reply.code(code).send(errorBody('bad_request', 'Solicitud no válida.'));
    // Sin detalles internos: podrían contener contenido de documentos.
    return reply.code(500).send(errorBody('internal', 'Error interno del servicio.'));
  });

  healthRoute(app, config);
  evidenceRoutes(app, config, store);
  return app;
}

/** Único punto donde se abre el puerto: siempre en 127.0.0.1, sin parámetro de dirección. */
export async function listenLoopback(app: FastifyInstance, port: number): Promise<{ address: string; port: number }> {
  await app.listen({ host: HOST, port });
  const a = app.server.address();
  if (a === null || typeof a === 'string') throw new Error('No se pudo leer la dirección del servicio.');
  app.allowedHosts.add(`127.0.0.1:${a.port}`);
  app.allowedHosts.add(`localhost:${a.port}`);
  return { address: a.address, port: a.port };
}
