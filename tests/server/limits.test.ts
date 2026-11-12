import { describe, expect, it } from 'vitest';
import { validateFiles } from '../../src/domain/fileValidation.ts';
import { MAX_NAME_LENGTH, MAX_SIZE_BYTES, validateUpload } from '../../server/src/limits.ts';

describe('validateUpload (mismas reglas que FR-010)', () => {
  it('acepta PDF, DOCX, TXT, VTT, SRT y XLSX dentro de los límites', () => {
    for (const ext of ['pdf', 'docx', 'txt', 'vtt', 'srt', 'xlsx', 'PDF']) {
      expect(validateUpload({ name: `archivo.${ext}`, size: 1000 })).toEqual({ ok: true });
    }
  });

  it('el máximo es de 26 214 400 bytes (25 MB) y el nombre de 150 caracteres', () => {
    expect(MAX_SIZE_BYTES).toBe(26_214_400);
    expect(MAX_NAME_LENGTH).toBe(150);
    expect(validateUpload({ name: 'a.pdf', size: MAX_SIZE_BYTES })).toEqual({ ok: true });
    expect(validateUpload({ name: 'a.pdf', size: MAX_SIZE_BYTES + 1 })).toMatchObject({ ok: false, reason: 'demasiado_grande' });
    expect(validateUpload({ name: 'a'.repeat(MAX_NAME_LENGTH - 4) + '.pdf', size: 10 })).toEqual({ ok: true });
    expect(validateUpload({ name: 'a'.repeat(MAX_NAME_LENGTH - 3) + '.pdf', size: 10 })).toMatchObject({ ok: false, reason: 'nombre_largo' });
  });

  it('rechaza el audio y otros formatos', () => {
    for (const n of ['voz.mp3', 'voz.wav', 'voz.m4a', 'programa.exe', 'sin-extension']) {
      expect(validateUpload({ name: n, size: 10 })).toMatchObject({ ok: false, reason: 'formato_no_permitido' });
    }
  });

  it('rechaza un archivo vacío', () => {
    expect(validateUpload({ name: 'a.txt', size: 0 })).toMatchObject({ ok: false, reason: 'vacio' });
  });

  it('los mensajes coinciden con los de la 001 (src/domain/fileValidation.ts)', () => {
    const casos = [
      { name: 'voz.mp3', size: 10 },
      { name: 'a.pdf', size: MAX_SIZE_BYTES + 1 },
      { name: 'a'.repeat(200) + '.pdf', size: 10 },
      { name: 'a.txt', size: 0 },
      { name: 'sin-extension', size: 10 },
    ];
    for (const c of casos) {
      const mia = validateUpload(c);
      const suya = validateFiles([{ ...c, type: '' }], []).rejected[0];
      expect(mia.ok, c.name).toBe(false);
      if (!mia.ok) expect(mia.message, c.name).toBe(suya.reason);
    }
  });
});
