// Almacén EN MEMORIA por proyecto (AG-025, AG-026): ningún acceso a disco. Se pierde al cerrar el servicio.
import type { Chunk, RawChunk } from './chunk.ts';

export interface StoredFileInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'extracted' | 'failed';
  chars: number;
  chunkCount: number;
  reason?: string;
  message?: string;
  warning?: string;
}

export interface SearchableFile {
  id: string;
  name: string;
  chunks: Chunk[];
}

export interface Store {
  /** Guarda un archivo; si ya hay uno con el mismo nombre (sin distinguir mayúsculas) lo reemplaza. */
  putFile(projectId: string, info: StoredFileInfo, chunks: readonly RawChunk[]): void;
  listFiles(projectId: string): StoredFileInfo[];
  removeFile(projectId: string, fileId: string): boolean;
  chunksOf(projectId: string, fileId: string): Chunk[];
  /** Archivos con texto extraído y sus fragmentos (para buscar y verificar). */
  searchableFiles(projectId: string): SearchableFile[];
  clearProject(projectId: string): void;
}

export function createStore(): Store {
  const projects = new Map<string, Array<{ info: StoredFileInfo; chunks: Chunk[] }>>();
  const entries = (p: string) => projects.get(p) ?? [];
  return {
    putFile(projectId, info, chunks) {
      const list = entries(projectId).filter((e) => e.info.name.toLowerCase() !== info.name.toLowerCase());
      list.push({ info, chunks: chunks.map((c) => ({ fileId: info.id, location: c.location, text: c.text })) });
      projects.set(projectId, list);
    },
    listFiles: (p) => entries(p).map((e) => e.info),
    removeFile(projectId, fileId) {
      const list = entries(projectId);
      const next = list.filter((e) => e.info.id !== fileId);
      if (next.length === list.length) return false;
      projects.set(projectId, next);
      return true;
    },
    chunksOf: (p, id) => entries(p).find((e) => e.info.id === id)?.chunks ?? [],
    searchableFiles: (p) => entries(p).filter((e) => e.info.status === 'extracted' && e.chunks.length > 0).map((e) => ({ id: e.info.id, name: e.info.name, chunks: e.chunks })),
    clearProject: (p) => void projects.delete(p),
  };
}
