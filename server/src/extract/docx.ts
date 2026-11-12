import mammoth from 'mammoth';
import { ExtractFailure, isOle, type Extracted } from './errors.ts';

/** «Párrafo N» = N-ésimo párrafo NO vacío (puede no coincidir con la numeración de Word si hay párrafos vacíos). */
export async function extractDocx(bytes: Uint8Array): Promise<Extracted> {
  if (isOle(bytes)) throw new ExtractFailure('cifrado');
  let value: string;
  try {
    ({ value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) }));
  } catch {
    throw new ExtractFailure('danado');
  }
  const chunks = value
    .split(/\n{2,}|\r\n(?:\r\n)+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((text, i) => ({ location: { kind: 'paragraph' as const, n: i + 1 }, text }));
  if (chunks.length === 0) throw new ExtractFailure('sin_texto');
  return { chunks };
}
