import { describe, expect, it } from 'vitest';
import { canGenerate, captureProgress, kindOfFile, projectProgress } from '../../src/domain/progress';

describe('kindOfFile', () => {
  it('txt, vtt y srt son transcripciones; pdf y docx, documentos', () => {
    expect(kindOfFile('a.txt')).toBe('transcripcion');
    expect(kindOfFile('a.VTT')).toBe('transcripcion');
    expect(kindOfFile('a.srt')).toBe('transcripcion');
    expect(kindOfFile('a.pdf')).toBe('documento');
    expect(kindOfFile('a.docx')).toBe('documento');
  });
});

describe('captureProgress', () => {
  const qs = ['q1', 'q2', 'q3', 'q4'];
  it('cuenta preguntas respondidas (ignora vacías y espacios), entrevistas y documentos', () => {
    const r = captureProgress(qs, { q1: 'a', q2: '  ', q3: 'x' }, ['documento', 'transcripcion', 'entrevista', 'documento']);
    expect(r.questionsAnswered).toBe(2);
    expect(r.questionsTotal).toBe(4);
    expect(r.interviews).toBe(2);
    expect(r.documents).toBe(2);
    expect(r.evidence).toBe(4);
  });
  it('ignora respuestas de preguntas que no existen', () => {
    expect(captureProgress(qs, { zzz: 'a' }, []).questionsAnswered).toBe(0);
  });
  it('porcentaje: preguntas + un paso por tener evidencia', () => {
    expect(captureProgress(qs, {}, []).percent).toBe(0);
    expect(captureProgress(qs, {}, ['documento']).percent).toBe(20); // 1 de 5 pasos
    expect(captureProgress(qs, { q1: 'a', q2: 'b', q3: 'c', q4: 'd' }, ['documento']).percent).toBe(100);
  });
  it('sin preguntas, el avance depende solo de la evidencia', () => {
    expect(captureProgress([], {}, []).percent).toBe(0);
    expect(captureProgress([], {}, ['documento']).percent).toBe(100);
  });
});

describe('canGenerate', () => {
  it('exige al menos un elemento de evidencia (de ejemplo o propio)', () => {
    expect(canGenerate(0)).toBe(false);
    expect(canGenerate(1)).toBe(true);
    expect(canGenerate(7)).toBe(true);
  });
});

describe('projectProgress', () => {
  it('sin nada: Evidencia, 0 %, pendiente', () => {
    expect(projectProgress({ evidenceCount: 0, diagnosis: 'none', strategy: 'none' })).toMatchObject({
      stage: 'Evidencia',
      percent: 0,
      status: 'pendiente',
    });
  });
  it('con evidencia: pasa a Diagnóstico, 33 %, en curso', () => {
    expect(projectProgress({ evidenceCount: 3, diagnosis: 'none', strategy: 'none' })).toMatchObject({
      stage: 'Diagnóstico',
      percent: 33,
      status: 'en-curso',
    });
  });
  it('diagnóstico generado sin emitir sigue en Diagnóstico', () => {
    expect(projectProgress({ evidenceCount: 3, diagnosis: 'generated', strategy: 'none' })).toMatchObject({
      stage: 'Diagnóstico',
      percent: 33,
    });
  });
  it('diagnóstico emitido: Estrategia, 67 %', () => {
    expect(projectProgress({ evidenceCount: 3, diagnosis: 'issued', strategy: 'none' })).toMatchObject({
      stage: 'Estrategia',
      percent: 67,
      status: 'en-curso',
    });
  });
  it('estrategia enviada: 100 % completado', () => {
    expect(projectProgress({ evidenceCount: 3, diagnosis: 'issued', strategy: 'sent' })).toMatchObject({
      stage: 'Estrategia',
      percent: 100,
      status: 'completado',
    });
  });
});
