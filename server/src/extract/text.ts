import { ExtractFailure, type Extracted } from './errors.ts';

const decode = (bytes: Uint8Array) => new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '');

/** TXT: un fragmento por línea no vacía, con su número de línea real. */
export function extractTxt(bytes: Uint8Array): Extracted {
  const chunks = decode(bytes)
    .split(/\r?\n/)
    .flatMap((line, i) => (line.trim() ? [{ location: { kind: 'line' as const, n: i + 1 }, text: line.trim() }] : []));
  if (chunks.length === 0) throw new ExtractFailure('sin_texto');
  return { chunks };
}

const TIME = /(?:(\d+):)?(\d{1,2}):(\d{2})[.,]\d{1,3}\s*-->/;
const pad = (n: number) => String(n).padStart(2, '0');

/** Inicio del bloque como «mm:ss» (los minutos pueden pasar de 59 si el material dura más de una hora). */
function startOf(line: string): string | null {
  const m = TIME.exec(line);
  if (!m) return null;
  const total = Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** VTT y SRT: un fragmento por bloque (el número de bloque, los tiempos y las etiquetas no entran al texto). */
export function extractSubtitles(bytes: Uint8Array): Extracted {
  const blocks = decode(bytes).split(/\r?\n\s*\r?\n/);
  const chunks: Extracted['chunks'] = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const at = lines.findIndex((l) => l.includes('-->'));
    if (at < 0) continue; // encabezado WEBVTT, NOTE, STYLE…
    const start = startOf(lines[at]);
    if (!start) continue;
    const text = lines
      .slice(at + 1)
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) chunks.push({ location: { kind: 'time', start }, text });
  }
  if (chunks.length === 0) throw new ExtractFailure('sin_texto');
  return { chunks };
}
