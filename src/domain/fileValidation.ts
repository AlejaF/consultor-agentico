export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'vtt', 'srt'] as const;
export const ALLOWED_LABEL = 'PDF, DOCX, TXT, VTT y SRT';
export const MAX_SIZE_BYTES = 26_214_400; // 25 MB
export const MAX_NAME_LENGTH = 150;

/** Solo se leen nombre, tipo y tamaño (FR-011): nunca el contenido. */
export interface FileInfo {
  name: string;
  type: string;
  size: number;
}

export interface Rejection {
  name: string;
  reason: string;
}

export function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i + 1).toLowerCase();
}

/** Valida una selección: acepta los válidos y explica cada rechazo (FR-010). */
export function validateFiles(
  files: readonly FileInfo[],
  existing: readonly { name: string }[],
): { accepted: FileInfo[]; rejected: Rejection[] } {
  const accepted: FileInfo[] = [];
  const rejected: Rejection[] = [];
  const taken = new Set(existing.map((e) => e.name.toLowerCase()));

  for (const f of files) {
    const info: FileInfo = { name: f.name, type: f.type, size: f.size };
    const ext = extensionOf(f.name);
    let reason: string | null = null;
    if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      reason = `Formato no permitido${ext ? ` (.${ext})` : ''}. Formatos permitidos: ${ALLOWED_LABEL}.`;
    } else if (f.size <= 0) {
      reason = 'El archivo está vacío.';
    } else if (f.size > MAX_SIZE_BYTES) {
      reason = 'Supera el tamaño máximo de 25 MB.';
    } else if (f.name.length > MAX_NAME_LENGTH) {
      reason = `El nombre supera los ${MAX_NAME_LENGTH} caracteres.`;
    } else if (taken.has(f.name.toLowerCase())) {
      reason = 'Ya hay un archivo con el mismo nombre en este proyecto.';
    }
    if (reason) {
      rejected.push({ name: f.name, reason });
    } else {
      accepted.push(info);
      taken.add(f.name.toLowerCase());
    }
  }
  return { accepted, rejected };
}
