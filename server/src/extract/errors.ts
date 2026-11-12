export type FailReason =
  | 'formato_no_permitido'
  | 'vacio'
  | 'pdf_sin_texto'
  | 'sin_texto'
  | 'cifrado'
  | 'danado'
  | 'tiempo_agotado';

export const MESSAGES: Record<Exclude<FailReason, 'formato_no_permitido'>, string> = {
  vacio: 'El archivo está vacío.',
  pdf_sin_texto: 'Este PDF no tiene texto seleccionable (parece escaneado). Esta versión no usa OCR.',
  sin_texto: 'No se encontró texto en este archivo.',
  cifrado: 'El archivo está protegido con contraseña (cifrado) y no se puede leer.',
  danado: 'El archivo parece dañado o no es del tipo que indica su extensión; no se pudo leer.',
  tiempo_agotado: 'Se tardó demasiado en leer este archivo y se canceló.',
};

/** Fallo esperado de un extractor, con su motivo (nunca lleva contenido del documento). */
export class ExtractFailure extends Error {
  readonly reason: FailReason;
  constructor(reason: FailReason) {
    super(reason);
    this.name = 'ExtractFailure';
    this.reason = reason;
  }
}

export interface Extracted {
  chunks: Array<{ location: import('../chunk.ts').Location; text: string }>;
  warning?: 'tope_filas_alcanzado' | 'tope_paginas_alcanzado';
}

export interface ExtractOptions {
  maxXlsxRows: number;
  maxPdfPages: number;
}

/** Firma de los contenedores OLE: así se guardan los archivos de Office protegidos con contraseña. */
export function isOle(bytes: Uint8Array): boolean {
  const sig = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
  return bytes.length >= 8 && sig.every((b, i) => bytes[i] === b);
}
