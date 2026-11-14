import type { RealCitation, RealLocation } from '../state/types';
import type { ResolvedCitation } from './evidence';

/** Ubicación en español según el tipo de archivo (AG-014): página, párrafo, hoja y fila, línea o minuto. */
export function formatRealLocation(l: RealLocation): string {
  switch (l.kind) {
    case 'page':
      return `pág. ${l.page}`;
    case 'paragraph':
      return `párrafo ${l.n}`;
    case 'sheet':
      return `hoja “${l.sheet}”, fila ${l.row}`;
    case 'line':
      return `línea ${l.n}`;
    case 'time':
      return `minuto ${l.start}`;
  }
}

/** Una cita real con la forma que usan las tarjetas de la 001; `real` la distingue de la evidencia de ejemplo (AG-024). */
export function resolveRealCitation(c: RealCitation, index: number): ResolvedCitation {
  const locator = formatRealLocation(c.location);
  return { excerptId: `real-${index}`, slot: 1, sourceName: c.file, locator, text: c.quote, label: `${c.file} · ${locator}`, real: { verified: c.verified } };
}
