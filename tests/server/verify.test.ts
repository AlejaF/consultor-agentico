import { describe, expect, it } from 'vitest';
import type { Location } from '../../server/src/chunk.ts';
import { normalize, verifyQuote } from '../../server/src/verify.ts';

const p = (page: number): Location => ({ kind: 'page', page });
const chunks = [
  { location: p(1), text: 'Los datos de Empresa Ficticia Alfa viven en tres sistemas distintos que no se comunican.' },
  { location: p(2), text: 'No existe un responsable único de la calidad de los datos en toda la organización.' },
  { location: p(3), text: 'La dirección quiere duplicar las ventas, pero no conoce el costo de atender a un cliente nuevo.' },
];

describe('normalize', () => {
  it('pasa a minúsculas, quita tildes, colapsa espacios y recorta', () => {
    expect(normalize('  ÁRBOL   Ñandú\n\t corazón  ')).toBe('arbol nandu corazon');
  });
  it('trata cualquier espacio en blanco (saltos de línea, tabuladores, espacio duro) como un espacio', () => {
    expect(normalize('uno dos\r\ntres')).toBe('uno dos tres');
  });
});

describe('verifyQuote', () => {
  it('verifica una cita literal en la ubicación indicada', () => {
    expect(verifyQuote({ quote: 'tres sistemas distintos que no se comunican', location: p(1), chunks })).toEqual({ ok: true });
  });

  it('verifica aunque difiera en mayúsculas, tildes y espacios (AG-015)', () => {
    const r = verifyQuote({ quote: 'NO EXISTE   UN responsable unico\nde la calidad', location: p(2), chunks });
    expect(r).toEqual({ ok: true });
  });

  it('NO verifica un fragmento que no está en el texto', () => {
    const r = verifyQuote({ quote: 'la empresa tiene un plan de inversión aprobado para el año', location: p(1), chunks });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe('not_in_file');
      expect(r.message.length).toBeGreaterThan(0);
    }
  });

  it('exige un mínimo de 20 caracteres normalizados', () => {
    const r = verifyQuote({ quote: 'tres sistemas', location: p(1), chunks });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('quote_too_short');
    expect(verifyQuote({ quote: '   ', location: p(1), chunks }).ok).toBe(false);
  });

  it('si el fragmento está en otra ubicación del mismo archivo, el error indica la ubicación correcta', () => {
    const r = verifyQuote({ quote: 'responsable único de la calidad de los datos', location: p(1), chunks });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe('not_in_location');
      expect(r.foundAt).toEqual(p(2));
      expect(r.message).toContain('pág. 2');
    }
  });

  it('si la ubicación no existe en el archivo, lo dice', () => {
    const r = verifyQuote({ quote: 'tres sistemas distintos que no se comunican', location: p(9), chunks });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe('location_not_found');
      expect(r.message).toContain('pág. 9');
    }
  });

  it('un fragmento que cruza dos ubicaciones no se verifica', () => {
    const r = verifyQuote({ quote: 'que no se comunican. No existe un responsable único', location: p(1), chunks });
    expect(r.ok).toBe(false);
  });

  it('compara ubicaciones de todos los tipos (hoja y fila, línea, minuto, párrafo)', () => {
    const mixed = [
      { location: { kind: 'sheet', sheet: 'Ventas', row: 2 } as Location, text: 'Enero | 100 | cliente nuevo costoso' },
      { location: { kind: 'line', n: 7 } as Location, text: 'Nadie revisa los indicadores cada semana en la empresa.' },
      { location: { kind: 'time', start: '03:10' } as Location, text: 'Tenemos miedo de que la automatización nos quite el trabajo.' },
      { location: { kind: 'paragraph', n: 4 } as Location, text: 'El equipo de tecnología tiene tres personas y ninguna sabe analítica.' },
    ];
    for (const c of mixed) {
      const q = c.text.slice(0, 30);
      if (q.length >= 20) expect(verifyQuote({ quote: q, location: c.location, chunks: mixed })).toEqual({ ok: true });
    }
    const wrong = verifyQuote({ quote: 'Nadie revisa los indicadores cada semana', location: { kind: 'line', n: 8 }, chunks: mixed });
    expect(wrong.ok).toBe(false);
  });
});
