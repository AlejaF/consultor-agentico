import { useState } from 'react';
import { createRealProvider } from '../providers/real';
import type { ServerFileResult, ServiceError } from '../providers/types';
import { useAppState } from '../state/context';
import { FileDropzone } from './FileDropzone';
import { PrivacyNoticeReal } from './PrivacyNoticeReal';
import { ServerFilesList } from './ServerFilesList';

const WARNING: Record<string, string> = {
  tope_filas_alcanzado: 'Se leyó solo una parte de la hoja (tope de filas).',
  tope_paginas_alcanzado: 'Se leyeron solo las primeras páginas (tope de páginas).',
};

/** Estado de extracción de un archivo, con el motivo concreto cuando falla (AG-007). */
export function extractionText(r: ServerFileResult): string {
  if (r.status === 'failed') return `No se pudo leer: ${r.message ?? r.reason ?? 'motivo desconocido'}`;
  const chars = r.chars !== undefined ? `Texto extraído (${r.chars} caracteres)` : 'Texto extraído';
  return r.warning ? `${chars}. ${WARNING[r.warning] ?? r.warning}` : chars;
}

/** Captura de evidencia en modo IA real: aviso previo, carga al servicio local y resultado de la extracción. */
export function RealEvidence({ projectId }: { projectId: string }) {
  const { state, dispatch } = useAppState();
  const ps = state.projects[projectId];
  const [results, setResults] = useState<ServerFileResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);
  const locked = ps.diagnosis.status !== 'none';

  async function upload(files: File[]) {
    setUploading(true);
    setError(null);
    const r = await createRealProvider().uploadFiles(projectId, files);
    setUploading(false);
    if (!r.ok) {
      setResults([]);
      setError(r.error);
      return;
    }
    setResults(r.value);
    const byName = new Map(files.map((f) => [f.name, f]));
    dispatch({
      type: 'addServerFiles',
      projectId,
      files: r.value
        .filter((x) => x.status === 'extracted')
        .map((x) => ({ id: x.id, name: x.name, type: x.type ?? byName.get(x.name)?.type ?? '', size: x.size ?? byName.get(x.name)?.size ?? 0 })),
    });
  }

  return (
    <>
      {locked && (
        <p className="subtitle" data-testid="real-evidence-locked">
          Este proyecto ya tiene diagnóstico: los archivos nuevos no cambian lo generado.
        </p>
      )}
      <FileDropzone existingNames={(ps.serverFiles ?? []).map((f) => f.name)} notice={<PrivacyNoticeReal />} onAccepted={() => {}} onFilesAccepted={(f) => void upload(f)} />
      <section className="card" aria-labelledby="real-resultado-titulo">
        <h2 id="real-resultado-titulo">Resultado de la última carga</h2>
        <div role="status" aria-live="polite" data-testid="real-upload-result">
          {uploading && <p>Enviando al servicio local y extrayendo el texto…</p>}
          {error && (
            <p role="alert" data-testid="real-upload-error">
              {error.message}
            </p>
          )}
          {!uploading && !error && results.length === 0 && <p className="subtitle">Aún no cargaste archivos en esta sesión.</p>}
          <ul className="server-files">
            {results.map((r) => (
              <li key={r.id} data-testid={`upload-${r.name}`} data-status={r.status}>
                <span>
                  <strong>{r.name}</strong>: {extractionText(r)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <ServerFilesList projectId={projectId} refreshKey={results} />
    </>
  );
}
