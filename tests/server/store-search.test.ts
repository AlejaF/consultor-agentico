import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Location } from '../../server/src/chunk.ts';
import { searchEvidence } from '../../server/src/search.ts';
import { createStore } from '../../server/src/store.ts';

const L = (n: number): Location => ({ kind: 'line', n });
const file = (id: string, name: string) => ({ id, name, type: 'text/plain', size: 10, status: 'extracted' as const, chars: 10, chunkCount: 2 });

describe('createStore (memoria por proyecto)', () => {
  it('guarda, lista, reemplaza por nombre y quita archivos por proyecto', () => {
    const s = createStore();
    s.putFile('P-A', file('f1', 'a.txt'), [{ location: L(1), text: 'uno' }]);
    s.putFile('P-A', file('f2', 'b.txt'), [{ location: L(1), text: 'dos' }]);
    s.putFile('P-B', file('f3', 'a.txt'), [{ location: L(1), text: 'tres' }]);
    expect(s.listFiles('P-A').map((f) => f.name)).toEqual(['a.txt', 'b.txt']);
    expect(s.listFiles('P-B')).toHaveLength(1);
    expect(s.listFiles('P-Z')).toEqual([]);
    // subir otra vez el mismo nombre reemplaza (no duplica)
    s.putFile('P-A', file('f9', 'A.TXT'), [{ location: L(1), text: 'nuevo' }]);
    expect(s.listFiles('P-A').map((f) => f.id)).toEqual(['f2', 'f9']);
    expect(s.removeFile('P-A', 'f2')).toBe(true);
    expect(s.removeFile('P-A', 'f2')).toBe(false);
    expect(s.listFiles('P-A').map((f) => f.id)).toEqual(['f9']);
  });

  it('chunksOf devuelve los fragmentos de un archivo con su fileId', () => {
    const s = createStore();
    s.putFile('P-A', file('f1', 'a.txt'), [{ location: L(1), text: 'uno' }, { location: L(2), text: 'dos' }]);
    expect(s.chunksOf('P-A', 'f1')).toEqual([
      { fileId: 'f1', location: L(1), text: 'uno' },
      { fileId: 'f1', location: L(2), text: 'dos' },
    ]);
    expect(s.chunksOf('P-A', 'nope')).toEqual([]);
  });

  it('un archivo con extracción fallida se lista pero no aporta fragmentos', () => {
    const s = createStore();
    s.putFile('P-A', { ...file('f1', 'x.pdf'), status: 'failed', reason: 'pdf_sin_texto', message: 'm' }, []);
    expect(s.listFiles('P-A')[0].status).toBe('failed');
    expect(s.searchableFiles('P-A')).toEqual([]);
  });

  it('clearProject borra todo el proyecto', () => {
    const s = createStore();
    s.putFile('P-A', file('f1', 'a.txt'), [{ location: L(1), text: 'uno' }]);
    s.clearProject('P-A');
    expect(s.listFiles('P-A')).toEqual([]);
  });
});

describe('searchEvidence (palabras clave, sin vectores)', () => {
  const files = [
    {
      id: 'f1', name: 'politica.txt',
      chunks: [
        { fileId: 'f1', location: L(1), text: 'Los datos de clientes viven en tres sistemas distintos.' },
        { fileId: 'f1', location: L(2), text: 'Cada área mantiene su propia hoja de cálculo.' },
        { fileId: 'f1', location: L(3), text: 'No hay un responsable único de la calidad de los datos.' },
      ],
    },
    { id: 'f2', name: 'notas.txt', chunks: [{ fileId: 'f2', location: L(1), text: 'Hablamos de la fiesta de fin de año y del menú.' }] },
  ];

  it('ordena por cuántos términos distintos coinciden y devuelve archivo, ubicación y texto', () => {
    const r = searchEvidence(files, 'calidad de los datos');
    expect(r[0]).toMatchObject({ archivo: 'politica.txt', ubicacion: 'línea 3' });
    expect(r[0].texto).toContain('calidad');
    expect(r.every((x) => x.archivo !== 'notas.txt')).toBe(true);
  });

  it('ignora mayúsculas y tildes y no cuenta palabras vacías', () => {
    expect(searchEvidence(files, 'UNICO responsable')[0].ubicacion).toBe('línea 3');
    // «de», «la», «los»: solo palabras vacías → sin resultados
    expect(searchEvidence(files, 'de la los')).toEqual([]);
  });

  it('devuelve como máximo 5 resultados', () => {
    const muchos = [{ id: 'f', name: 'm.txt', chunks: Array.from({ length: 12 }, (_, i) => ({ fileId: 'f', location: L(i + 1), text: `renglón con la palabra tesoro número ${i}` })) }];
    expect(searchEvidence(muchos, 'tesoro')).toHaveLength(5);
    expect(searchEvidence(muchos, 'tesoro', 3)).toHaveLength(3);
  });

  it('sin coincidencias o con consulta vacía devuelve lista vacía', () => {
    expect(searchEvidence(files, 'inexistente')).toEqual([]);
    expect(searchEvidence(files, '   ')).toEqual([]);
  });

  it('recorta el texto de cada resultado a 300 caracteres', () => {
    const largo = [{ id: 'f', name: 'l.txt', chunks: [{ fileId: 'f', location: L(1), text: 'palabra ' + 'x'.repeat(1000) }] }];
    expect(searchEvidence(largo, 'palabra')[0].texto.length).toBeLessThanOrEqual(301);
  });
});

describe('el servicio nunca toca el disco (AG-026)', () => {
  it('ningún módulo de server/src importa el sistema de archivos', () => {
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
      });
    const root = join(__dirname, '..', '..', 'server', 'src');
    const bad = walk(root).filter((f) => /from\s+['"](node:)?(fs|fs\/promises)['"]|require\(['"](node:)?fs/.test(readFileSync(f, 'utf8')));
    expect(bad).toEqual([]);
  });
});
