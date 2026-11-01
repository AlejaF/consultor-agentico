import { describe, expect, it } from 'vitest';
import { reducer } from '../../src/state/reducer';
import { createInitialState } from '../../src/state/initial';
import type { LocalFileMeta } from '../../src/state/types';

const file = (id: string, name = `${id}.pdf`): LocalFileMeta => ({ id, name, type: 'application/pdf', size: 10, addedAt: '2026-11-01T10:00:00Z' });

describe('archivos propios', () => {
  it('addFiles agrega y guarda solo { id, name, type, size, addedAt }', () => {
    const extra = { ...file('f1'), content: 'SECRETO' } as LocalFileMeta;
    const s = reducer(createInitialState(), { type: 'addFiles', projectId: 'P-A', files: [extra, file('f2')] });
    expect(s.projects['P-A'].localFiles).toEqual([file('f1'), file('f2')]);
    expect(JSON.stringify(s)).not.toContain('SECRETO');
  });
  it('addFiles no toca otros proyectos', () => {
    const s0 = createInitialState();
    const s = reducer(s0, { type: 'addFiles', projectId: 'P-A', files: [file('f1')] });
    expect(s.projects['P-B']).toBe(s0.projects['P-B']);
  });
  it('removeFile quita solo ese archivo', () => {
    let s = reducer(createInitialState(), { type: 'addFiles', projectId: 'P-A', files: [file('f1'), file('f2')] });
    s = reducer(s, { type: 'removeFile', projectId: 'P-A', fileId: 'f1' });
    expect(s.projects['P-A'].localFiles.map((x) => x.id)).toEqual(['f2']);
  });
  it('proyecto inexistente: sin cambios', () => {
    const s0 = createInitialState();
    expect(reducer(s0, { type: 'addFiles', projectId: 'P-ZZ', files: [file('f1')] })).toBe(s0);
    expect(reducer(s0, { type: 'removeFile', projectId: 'P-ZZ', fileId: 'f1' })).toBe(s0);
    expect(reducer(s0, { type: 'setAnswer', projectId: 'P-ZZ', questionId: 'q', value: 'x' })).toBe(s0);
  });
});

describe('respuestas de captura', () => {
  it('setAnswer guarda y reemplaza la respuesta', () => {
    let s = reducer(createInitialState(), { type: 'setAnswer', projectId: 'P-A', questionId: 'q1', value: 'uno' });
    s = reducer(s, { type: 'setAnswer', projectId: 'P-A', questionId: 'q1', value: 'dos' });
    expect(s.projects['P-A'].answers).toEqual({ q1: 'dos' });
  });
});

describe('evidencia agregada tras emitir', () => {
  it('no altera el diagnóstico emitido ni la estrategia', () => {
    const s0 = createInitialState();
    s0.projects['P-B'].diagnosis = { status: 'issued', issuedAt: '2026-11-01T09:00:00Z', decisions: {} };
    const s = reducer(s0, { type: 'addFiles', projectId: 'P-B', files: [file('f9')] });
    expect(s.projects['P-B'].diagnosis).toBe(s0.projects['P-B'].diagnosis);
    expect(s.projects['P-B'].strategy).toBe(s0.projects['P-B'].strategy);
    expect(s.projects['P-B'].localFiles).toHaveLength(1);
  });
});
