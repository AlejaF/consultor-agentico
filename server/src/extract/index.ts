// Despacho de extracción por formato. Nunca lanza: todo fallo se devuelve con un motivo claro (AG-007).
import { extensionOf, isAllowedExtension, validateUpload, type AllowedExtension } from '../limits.ts';
import { extractDocx } from './docx.ts';
import { ExtractFailure, MESSAGES, type ExtractOptions, type Extracted, type FailReason } from './errors.ts';
import { extractPdf } from './pdf.ts';
import { extractSubtitles, extractTxt } from './text.ts';
import { extractXlsx } from './xlsx.ts';

export type ExtractResult =
  | ({ status: 'extracted'; chars: number } & Extracted)
  | { status: 'failed'; reason: FailReason; message: string };

export type Extractor = (bytes: Uint8Array, opts: ExtractOptions) => Promise<Extracted> | Extracted;

export interface ExtractCallOptions extends Partial<ExtractOptions> {
  /** Tiempo máximo por archivo, en ms (por defecto 20 000). */
  timeoutMs?: number;
  /** Solo para pruebas: sustituye extractores. */
  extractors?: Partial<Record<AllowedExtension, Extractor>>;
}

const DEFAULTS: ExtractOptions = { maxXlsxRows: 2000, maxPdfPages: 200 };

const EXTRACTORS: Record<AllowedExtension, Extractor> = {
  pdf: extractPdf,
  docx: (b) => extractDocx(b),
  xlsx: extractXlsx,
  txt: (b) => extractTxt(b),
  vtt: (b) => extractSubtitles(b),
  srt: (b) => extractSubtitles(b),
};

const failed = (reason: FailReason, message?: string): ExtractResult => ({
  status: 'failed',
  reason,
  message: message ?? MESSAGES[reason as Exclude<FailReason, 'formato_no_permitido'>],
});

export async function extractFile(file: { name: string; bytes: Uint8Array }, options: ExtractCallOptions = {}): Promise<ExtractResult> {
  const ext = extensionOf(file.name);
  if (!isAllowedExtension(ext)) {
    const check = validateUpload({ name: file.name, size: 1 });
    return failed('formato_no_permitido', check.ok ? undefined : check.message);
  }
  if (file.bytes.length === 0) return failed('vacio');

  const opts: ExtractOptions = { maxXlsxRows: options.maxXlsxRows ?? DEFAULTS.maxXlsxRows, maxPdfPages: options.maxPdfPages ?? DEFAULTS.maxPdfPages };
  const extractor = options.extractors?.[ext] ?? EXTRACTORS[ext];
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new ExtractFailure('tiempo_agotado')), options.timeoutMs ?? 20_000);
    });
    const out = await Promise.race([Promise.resolve(extractor(file.bytes, opts)), timeout]);
    const chars = out.chunks.reduce((n, c) => n + c.text.length, 0);
    return { status: 'extracted', chars, ...out };
  } catch (e) {
    // Solo se usa el motivo; nunca el mensaje de la librería (podría contener texto del documento).
    return failed(e instanceof ExtractFailure ? e.reason : 'danado');
  } finally {
    if (timer) clearTimeout(timer);
  }
}
