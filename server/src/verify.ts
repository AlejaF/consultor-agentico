// Verificador determinista de citas (AG-015, AG-016, SC-A1). No usa el modelo: solo texto.
// Una cita es «verificada» si el fragmento citado aparece literalmente, tras normalizar mayúsculas, tildes y
// espacios, en el fragmento de la ubicación indicada. Que el fragmento exista NO prueba que la conclusión sea correcta.
import { formatLocation, sameLocation, type Location, type RawChunk } from './chunk.ts';

export const MIN_QUOTE_CHARS = 20;

/** NFD, sin marcas diacríticas, minúsculas, cualquier espacio en blanco → un espacio, recortado. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/gu, ' ').trim();
}

export type VerifyResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'quote_too_short' | 'location_not_found' | 'not_in_location' | 'not_in_file';
      message: string;
      /** Si el fragmento está en otra ubicación del mismo archivo, cuál es. */
      foundAt?: Location;
    };

export function verifyQuote(input: { quote: string; location: Location; chunks: readonly RawChunk[] }): VerifyResult {
  const q = normalize(input.quote);
  if (q.length < MIN_QUOTE_CHARS) {
    return { ok: false, reason: 'quote_too_short', message: `La cita es demasiado corta: debe tener al menos ${MIN_QUOTE_CHARS} caracteres.` };
  }
  const here = input.chunks.find((c) => sameLocation(c.location, input.location));
  if (!here) {
    return { ok: false, reason: 'location_not_found', message: `La ubicación ${formatLocation(input.location)} no existe en este archivo.` };
  }
  if (normalize(here.text).includes(q)) return { ok: true };
  const other = input.chunks.find((c) => normalize(c.text).includes(q));
  if (other) {
    return {
      ok: false,
      reason: 'not_in_location',
      foundAt: other.location,
      message: `La cita no aparece en ${formatLocation(input.location)}; aparece en ${formatLocation(other.location)}. Corrige la ubicación.`,
    };
  }
  return { ok: false, reason: 'not_in_file', message: 'La cita no aparece en el archivo. Copia el fragmento exacto o elimina la cita.' };
}
