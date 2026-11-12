// Fragmentos de texto con ubicación (data-model «Fragmento»). El texto completo solo vive en memoria (AG-026).

export type Location =
  | { kind: 'page'; page: number }
  | { kind: 'paragraph'; n: number }
  | { kind: 'sheet'; sheet: string; row: number }
  | { kind: 'line'; n: number }
  | { kind: 'time'; start: string }; // «mm:ss»

export interface RawChunk {
  location: Location;
  text: string;
}

export interface Chunk extends RawChunk {
  fileId: string;
}

/** Ubicación en español, para mostrarla a la persona. */
export function formatLocation(l: Location): string {
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

export function sameLocation(a: Location, b: Location): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'page':
      return a.page === (b as typeof a).page;
    case 'paragraph':
    case 'line':
      return a.n === (b as typeof a).n;
    case 'sheet':
      return a.sheet === (b as typeof a).sheet && a.row === (b as typeof a).row;
    case 'time':
      return a.start === (b as typeof a).start;
  }
}
