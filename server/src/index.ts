// Arranque del servicio local. Uso: `npm run dev:server` (desde la raíz). La clave se lee de `server/.env`
// (ignorado por git) o del entorno; nunca se imprime.
import { buildServer, listenLoopback } from './app.ts';
import { ConfigError, loadConfig } from './config.ts';
import { createLogger } from './log.ts';

const logger = createLogger();
try {
  const config = loadConfig(process.env);
  const app = await buildServer(config, logger);
  const { address, port } = await listenLoopback(app, config.port);
  logger.info(`Servicio local de IA real escuchando en http://${address}:${port} (solo este equipo). ` +
    `Clave configurada: ${config.keyConfigured ? 'sí' : 'no'}. Proveedor: ${config.provider}.`);
  const stop = () => void app.close().finally(() => process.exit(0));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
} catch (e) {
  logger.info(e instanceof ConfigError ? e.message : 'No se pudo iniciar el servicio.');
  process.exit(1);
}
