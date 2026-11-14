import { useCallback, useEffect, useState } from 'react';
import { createRealProvider } from '../providers/real';
import type { ServerFileResult } from '../providers/types';
import { useAppState } from '../state/context';
import { extractionText } from './RealEvidence';

/**
 * Archivos que el servicio local tiene en memoria para este proyecto (AG-030): reaparecen tras recargar la página y se puede volver
 * a ejecutar el agente sin recargarlos. Si el servicio se reinició, avisa qué archivos hay que volver a cargar.
 */
export function ServerFilesList({ projectId, refreshKey }: { projectId: string; refreshKey?: unknown }) {
  const { state, dispatch } = useAppState();
  const known = state.projects[projectId].serverFiles ?? [];
  const [list, setList] = useState<ServerFileResult[] | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);

  const load = useCallback(async () => {
    const r = await createRealProvider().listFiles(projectId);
    if (!r.ok) {
      setUnreachable(true);
      return;
    }
    setUnreachable(false);
    setList(r.value);
  }, [projectId]);
  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  // Conciliación: lo que el navegador recuerda frente a lo que el servicio realmente conserva.
  useEffect(() => {
    if (list === null) return;
    const alive = new Set(list.filter((f) => f.status === 'extracted').map((f) => f.id));
    const gone = known.filter((f) => !alive.has(f.id));
    if (gone.length > 0) {
      setMissing(gone.map((f) => f.name));
      dispatch({ type: 'setServerFiles', projectId, files: known.filter((f) => alive.has(f.id)) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  async function remove(fileId: string) {
    const r = await createRealProvider().removeFile(projectId, fileId);
    if (r.ok) {
      dispatch({ type: 'removeServerFile', projectId, fileId });
      await load();
    }
  }
  async function removeAll() {
    for (const f of list ?? []) await createRealProvider().removeFile(projectId, f.id);
    dispatch({ type: 'setServerFiles', projectId, files: [] });
    await load();
  }

  return (
    <section className="card" aria-labelledby="archivos-servicio-titulo" data-testid="server-files">
      <h2 id="archivos-servicio-titulo">Archivos en el servicio</h2>
      <div role="status" aria-live="polite">
        {unreachable && <p>No se pudo consultar el servicio local.</p>}
        {missing.length > 0 && (
          <p data-testid="server-files-missing" className="no-support">
            El servicio se reinició o se cerró y ya no conserva estos archivos: {missing.join(', ')}. Vuelve a cargarlos para ejecutar el agente. Tus hallazgos y
            extractos guardados siguen visibles.
          </p>
        )}
        {list !== null && list.length === 0 && missing.length === 0 && <p className="subtitle">El servicio no tiene archivos de este proyecto.</p>}
      </div>
      <ul className="server-files">
        {(list ?? []).map((f) => (
          <li key={f.id} data-testid={`server-file-${f.name}`} data-status={f.status}>
            <span>
              <strong>{f.name}</strong>
              {f.type ? ` · ${f.type}` : ''}: {extractionText(f)}
            </span>
            <button type="button" onClick={() => void remove(f.id)}>
              Quitar<span className="visually-hidden"> {f.name} del servicio</span>
            </button>
          </li>
        ))}
      </ul>
      {(list?.length ?? 0) > 0 && (
        <button type="button" onClick={() => void removeAll()}>
          Quitar archivos del servicio
        </button>
      )}
    </section>
  );
}
