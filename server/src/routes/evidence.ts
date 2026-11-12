// POST/GET/DELETE /api/evidence (contracts/api.md). El texto se extrae y se queda en memoria: nada a disco (AG-026).
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { errorBody } from '../app.ts';
import type { Config } from '../config.ts';
import { extractFile } from '../extract/index.ts';
import { validateUpload } from '../limits.ts';
import type { Store, StoredFileInfo } from '../store.ts';

const PROJECT_ID = /^[A-Za-z0-9-]{1,32}$/;
const newId = () => `f-${randomUUID().slice(0, 8)}`;

export function evidenceRoutes(app: FastifyInstance, config: Config, store: Store): void {
  app.post('/api/evidence', async (req, reply) => {
    const projectId = (req.query as { projectId?: string }).projectId ?? '';
    if (!PROJECT_ID.test(projectId)) return reply.code(400).send(errorBody('bad_request', 'Falta un identificador de proyecto válido.'));
    if (!req.isMultipart()) return reply.code(400).send(errorBody('bad_request', 'Se esperaba una carga de archivos.'));

    const results: StoredFileInfo[] = [];
    for await (const part of req.parts()) {
      if (part.type !== 'file') continue;
      const base = { id: newId(), name: part.filename, type: part.mimetype, size: 0, chars: 0, chunkCount: 0 };
      let bytes: Buffer;
      try {
        bytes = await part.toBuffer();
      } catch {
        results.push({ ...base, status: 'failed', reason: 'danado', message: 'No se pudo recibir el archivo.' });
        continue;
      }
      if (part.file.truncated) {
        // Supera el tamaño máximo: se rechaza solo este archivo y el resto se procesa igual.
        results.push({ ...base, status: 'failed', reason: 'demasiado_grande', message: 'Supera el tamaño máximo de 25 MB.' });
        continue;
      }
      const check = validateUpload({ name: part.filename, size: bytes.length });
      if (!check.ok) {
        results.push({ ...base, size: bytes.length, status: 'failed', reason: check.reason, message: check.message });
        continue;
      }
      const r = await extractFile({ name: part.filename, bytes }, { maxXlsxRows: config.limits.maxXlsxRows });
      if (r.status === 'failed') {
        const info: StoredFileInfo = { ...base, size: bytes.length, status: 'failed', reason: r.reason, message: r.message };
        store.putFile(projectId, info, []);
        results.push(info);
      } else {
        const info: StoredFileInfo = { ...base, size: bytes.length, status: 'extracted', chars: r.chars, chunkCount: r.chunks.length, ...(r.warning ? { warning: r.warning } : {}) };
        store.putFile(projectId, info, r.chunks);
        results.push(info);
      }
    }
    if (results.length === 0) return reply.code(400).send(errorBody('bad_request', 'No llegó ningún archivo.'));
    return { files: results };
  });

  // AG-030 (RECORTABLE): reabrir la lista tras recargar la página.
  app.get('/api/evidence/:projectId', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    if (!PROJECT_ID.test(projectId)) return reply.code(400).send(errorBody('bad_request', 'Identificador de proyecto no válido.'));
    return { files: store.listFiles(projectId) };
  });

  // AG-030 (RECORTABLE): quitar un archivo de la memoria del servicio.
  app.delete('/api/evidence/:projectId/:fileId', async (req, reply) => {
    const { projectId, fileId } = req.params as { projectId: string; fileId: string };
    if (!PROJECT_ID.test(projectId)) return reply.code(400).send(errorBody('bad_request', 'Identificador de proyecto no válido.'));
    return store.removeFile(projectId, fileId) ? { ok: true } : reply.code(404).send(errorBody('bad_request', 'Ese archivo no está en el servicio.'));
  });
}
