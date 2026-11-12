import { extractText, getDocumentProxy } from 'unpdf';
import { ExtractFailure, type ExtractOptions, type Extracted } from './errors.ts';

export async function extractPdf(bytes: Uint8Array, opts: ExtractOptions): Promise<Extracted> {
  let pages: string[];
  try {
    const doc = await getDocumentProxy(new Uint8Array(bytes));
    ({ text: pages } = await extractText(doc, { mergePages: false }));
  } catch (e) {
    // Solo se mira el nombre del error: nunca se copia su mensaje (podría traer contenido).
    throw new ExtractFailure((e as { name?: string })?.name === 'PasswordException' ? 'cifrado' : 'danado');
  }
  const capped = pages.length > opts.maxPdfPages;
  const used = capped ? pages.slice(0, opts.maxPdfPages) : pages;
  const chunks = used.flatMap((t, i) => (t.trim() ? [{ location: { kind: 'page' as const, page: i + 1 }, text: t.trim() }] : []));
  if (chunks.length === 0) throw new ExtractFailure('pdf_sin_texto');
  return { chunks, ...(capped ? { warning: 'tope_paginas_alcanzado' as const } : {}) };
}
