// Mismas reglas que FR-010 de la 001 (src/domain/fileValidation.ts); una prueba compara los mensajes. Solo se lee nombre y tamaño.
export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'vtt', 'srt', 'xlsx'] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];
export const ALLOWED_LABEL = 'PDF, DOCX, TXT, VTT, SRT y XLSX';
export const MAX_SIZE_BYTES = 26_214_400; // 25 MB
export const MAX_NAME_LENGTH = 150;

export function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i + 1).toLowerCase();
}

export type UploadReason = 'formato_no_permitido' | 'vacio' | 'demasiado_grande' | 'nombre_largo';
export type UploadCheck = { ok: true } | { ok: false; reason: UploadReason; message: string };

export function isAllowedExtension(ext: string): ext is AllowedExtension {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

export function validateUpload(f: { name: string; size: number }): UploadCheck {
  const ext = extensionOf(f.name);
  if (!isAllowedExtension(ext)) {
    return { ok: false, reason: 'formato_no_permitido', message: `Formato no permitido${ext ? ` (.${ext})` : ''}. Formatos permitidos: ${ALLOWED_LABEL}.` };
  }
  if (f.size <= 0) return { ok: false, reason: 'vacio', message: 'El archivo está vacío.' };
  if (f.size > MAX_SIZE_BYTES) return { ok: false, reason: 'demasiado_grande', message: 'Supera el tamaño máximo de 25 MB.' };
  if (f.name.length > MAX_NAME_LENGTH) return { ok: false, reason: 'nombre_largo', message: `El nombre supera los ${MAX_NAME_LENGTH} caracteres.` };
  return { ok: true };
}
