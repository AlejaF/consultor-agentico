import { describe, expect, it } from 'vitest';
import { adoptionSteps, nextStep } from '../../src/domain/company';
import { SURVEY_QUESTIONS } from '../../src/data/survey';
import { reducer } from '../../src/state/reducer';
import { createInitialState } from '../../src/state/initial';

const base = { evidenceCount: 0, diagnosis: 'none', strategy: 'none' } as const;
const estado = (s: ReturnType<typeof adoptionSteps>) => s.map((x) => `${x.label}:${x.status}`);

describe('adoptionSteps (FR-034): tres pasos derivados del estado real del proyecto', () => {
  it('sin nada: todo Pendiente', () => {
    expect(estado(adoptionSteps(base))).toEqual(['Documentos:Pendiente', 'Diagnóstico:Pendiente', 'Estrategia:Pendiente']);
  });
  it('documentos Completado con al menos un elemento de evidencia', () => {
    expect(adoptionSteps({ ...base, evidenceCount: 1 })[0].status).toBe('Completado');
  });
  it('diagnóstico: En curso si está generado, Completado si está emitido', () => {
    expect(adoptionSteps({ ...base, diagnosis: 'generated' })[1].status).toBe('En curso');
    expect(adoptionSteps({ ...base, diagnosis: 'issued' })[1].status).toBe('Completado');
  });
  it('estrategia: En curso si está generada, Completado si está enviada', () => {
    expect(adoptionSteps({ ...base, strategy: 'generated' })[2].status).toBe('En curso');
    expect(adoptionSteps({ ...base, strategy: 'sent' })[2].status).toBe('Completado');
  });
});

describe('nextStep: el próximo paso sale del primer paso sin completar', () => {
  it('recorre los pasos en orden', () => {
    expect(nextStep(adoptionSteps(base), false)).toMatch(/documentos/i);
    expect(nextStep(adoptionSteps({ ...base, evidenceCount: 2 }), false)).toMatch(/diagnóstico/i);
    expect(nextStep(adoptionSteps({ evidenceCount: 2, diagnosis: 'issued', strategy: 'none' }), false)).toMatch(/estrategia/i);
  });
  it('con todo completado: la encuesta si falta, y si no el informe', () => {
    const todo = adoptionSteps({ evidenceCount: 2, diagnosis: 'issued', strategy: 'sent' });
    expect(nextStep(todo, false)).toMatch(/encuesta/i);
    expect(nextStep(todo, true)).toMatch(/informe/i);
  });
});

describe('encuesta simulada (FR-036)', () => {
  const respuestas = Object.fromEntries(SURVEY_QUESTIONS.map((q) => [q.id, 4]));
  it('tiene exactamente 3 preguntas', () => expect(SURVEY_QUESTIONS).toHaveLength(3));
  it('submitSurvey guarda las respuestas con la fecha', () => {
    const s = reducer(createInitialState(), { type: 'submitSurvey', projectId: 'P-B', answers: respuestas, at: '2026-11-02T10:00:00.000Z' });
    expect(s.surveys['P-B']).toEqual({ answers: respuestas, submittedAt: '2026-11-02T10:00:00.000Z' });
  });
  it('con preguntas sin responder o fuera de 1 a 5 no guarda nada', () => {
    const [q1, q2] = SURVEY_QUESTIONS;
    const ini = createInitialState();
    expect(reducer(ini, { type: 'submitSurvey', projectId: 'P-B', answers: { [q1.id]: 3 }, at: 'x' })).toBe(ini);
    expect(reducer(ini, { type: 'submitSurvey', projectId: 'P-B', answers: { ...respuestas, [q2.id]: 9 }, at: 'x' })).toBe(ini);
  });
  it('una encuesta ya guardada no se modifica', () => {
    const una = reducer(createInitialState(), { type: 'submitSurvey', projectId: 'P-B', answers: respuestas, at: 'a' });
    const otra = reducer(una, { type: 'submitSurvey', projectId: 'P-B', answers: { ...respuestas, [SURVEY_QUESTIONS[0].id]: 1 }, at: 'b' });
    expect(otra).toBe(una);
  });
  it('el estado inicial no trae encuesta (restablecer la borra)', () => {
    expect(createInitialState().surveys).toEqual({});
  });
});
