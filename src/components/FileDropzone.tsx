import { useRef, useState } from 'react';
import { ALLOWED_LABEL, validateFiles, type FileInfo, type Rejection } from '../domain/fileValidation';

export const PRIVACY_NOTICE =
  'Tus archivos se quedan en este navegador; no se envían a ningún servidor. En esta demo no se analizan.';

interface Props {
  existingNames: readonly string[];
  onAccepted: (files: FileInfo[]) => void;
  /** Referencia al botón de selección, para llevar el foco desde otros controles. */
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function FileDropzone({ existingNames, onAccepted, buttonRef }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<Rejection[]>([]);
  const [addedCount, setAddedCount] = useState<number | null>(null);

  function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    // Solo se leen nombre, tipo y tamaño: el contenido no se lee nunca.
    const infos = Array.from(files).map((f) => ({ name: f.name, type: f.type, size: f.size }));
    const result = validateFiles(
      infos,
      existingNames.map((name) => ({ name })),
    );
    setRejected(result.rejected);
    setAddedCount(result.accepted.length);
    if (result.accepted.length > 0) onAccepted(result.accepted);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <section aria-labelledby="carga-titulo" className="card">
      <h2 id="carga-titulo">Agregar archivos</h2>
      <p className="privacy" data-testid="privacy-notice">
        {PRIVACY_NOTICE}
      </p>
      <div
        className={over ? 'dropzone over' : 'dropzone'}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files);
        }}
      >
        <p>Arrastra aquí tus archivos o usa el botón.</p>
        <button type="button" className="primary" ref={buttonRef} onClick={() => inputRef.current?.click()}>
          Elegir archivos
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept=".pdf,.docx,.txt,.vtt,.srt"
          onChange={(e) => handle(e.target.files)}
        />
        <p className="subtitle">Formatos permitidos: {ALLOWED_LABEL}. Máximo 25 MB por archivo; nombre de hasta 150 caracteres.</p>
      </div>
      <div aria-live="polite" role="status" data-testid="upload-result">
        {addedCount !== null && addedCount > 0 && <p className="ok-text">Se agregaron {addedCount} archivo(s).</p>}
        {rejected.length > 0 && (
          <div className="rejections">
            <p>
              <strong>No se agregaron {rejected.length} archivo(s):</strong>
            </p>
            <ul>
              {rejected.map((r, i) => (
                <li key={`${r.name}-${i}`}>
                  <strong>{r.name}</strong>: {r.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
