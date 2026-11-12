// buscar_en_evidencia: búsqueda por palabras clave sobre los fragmentos, sin base vectorial (research §8).
import { formatLocation, type Chunk, type Location } from './chunk.ts';
import { normalize } from './verify.ts';

export interface SearchHit {
  fileId: string;
  archivo: string;
  ubicacion: string;
  location: Location;
  texto: string;
}

const STOP = new Set(
  'a al algo ante con contra cual cuando de del desde donde e el ella ellos en entre es esa ese eso esta este esto ha hay la las le les lo los me mi mis mas muy ni no nos o para pero por que se sin sobre son su sus te tu tus un una uno unos unas y ya'.split(' '),
);
const MAX_TEXT = 300;

function tokens(s: string): string[] {
  return normalize(s).match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function searchEvidence(files: ReadonlyArray<{ id: string; name: string; chunks: readonly Chunk[] }>, query: string, k = 5): SearchHit[] {
  const terms = [...new Set(tokens(query).filter((t) => !STOP.has(t)))];
  if (terms.length === 0) return [];
  const scored: Array<{ score: number; order: number; hit: SearchHit }> = [];
  let order = 0;
  for (const f of files) {
    for (const c of f.chunks) {
      const words = tokens(c.text);
      const score = terms.filter((t) => words.some((w) => w === t || (t.length >= 5 && w.startsWith(t)))).length;
      order += 1;
      if (score === 0) continue;
      const texto = c.text.length > MAX_TEXT ? `${c.text.slice(0, MAX_TEXT)}…` : c.text;
      scored.push({ score, order, hit: { fileId: f.id, archivo: f.name, ubicacion: formatLocation(c.location), location: c.location, texto } });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  return scored.slice(0, k).map((s) => s.hit);
}
