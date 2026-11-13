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

/** Inverso de `formatLocation`: lee la ubicación que escribe el modelo («pág. 3», «hoja “Ventas”, fila 7»…). `undefined` si no se reconoce. */
export function parseLocation(text: string): Location | undefined {
  const s = text.trim().replace(/\s+/g, ' ');
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^p[áa]g(?:ina|\.)?\s*(\d+)$/i))) return { kind: 'page', page: Number(m[1]) };
  if ((m = s.match(/^p[áa]rrafo\s*(\d+)$/i))) return { kind: 'paragraph', n: Number(m[1]) };
  if ((m = s.match(/^l[íi]nea\s*(\d+)$/i))) return { kind: 'line', n: Number(m[1]) };
  if ((m = s.match(/^minuto\s*(\d{1,3}:\d{2})$/i))) return { kind: 'time', start: m[1]!.padStart(5, '0') };
  if ((m = s.match(/^hoja\s*["“'«](.+?)["”'»],?\s*fila\s*(\d+)$/i))) return { kind: 'sheet', sheet: m[1]!, row: Number(m[2]) };
  return undefined;
}
