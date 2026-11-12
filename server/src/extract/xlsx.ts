import readXlsx from 'read-excel-file/node';
import { ExtractFailure, isOle, type ExtractOptions, type Extracted } from './errors.ts';

function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

/** Un fragmento por fila con contenido; «fila» es la posición real en la hoja (las filas vacías se saltan). */
export async function extractXlsx(bytes: Uint8Array, opts: ExtractOptions): Promise<Extracted> {
  if (isOle(bytes)) throw new ExtractFailure('cifrado');
  let sheets: Array<{ sheet: string; data: unknown[][] }>;
  try {
    sheets = (await readXlsx(Buffer.from(bytes))) as typeof sheets;
  } catch {
    throw new ExtractFailure('danado');
  }
  const chunks: Extracted['chunks'] = [];
  let capped = false;
  for (const s of sheets) {
    let used = 0;
    for (let i = 0; i < s.data.length; i++) {
      const cells = s.data[i].map(cell);
      if (cells.every((c) => c === '')) continue;
      if (used >= opts.maxXlsxRows) {
        capped = true;
        break;
      }
      used += 1;
      chunks.push({ location: { kind: 'sheet', sheet: s.sheet, row: i + 1 }, text: cells.join(' | ').replace(/(?: \| )+$/, '') });
    }
  }
  if (chunks.length === 0) throw new ExtractFailure('sin_texto');
  return { chunks, ...(capped ? { warning: 'tope_filas_alcanzado' as const } : {}) };
}
