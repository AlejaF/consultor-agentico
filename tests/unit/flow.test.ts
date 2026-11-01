import { describe, expect, it } from 'vitest';
import { flowSteps, type FlowInput } from '../../src/domain/flow';

const base: FlowInput = { evidenceCount: 0, hasAnswers: false, diagnosis: 'none', reviewed: 0, strategy: 'none' };
const states = (i: Partial<FlowInput>) => flowSteps({ ...base, ...i }).map((s) => s.status);

describe('flowSteps (pasos del flujo en la navegación)', () => {
  it('siempre son 4, en orden y con su etiqueta', () => {
    expect(flowSteps(base).map((s) => [s.id, s.label])).toEqual([
      ['evidencia', 'Evidencia'],
      ['diagnostico', 'Diagnóstico'],
      ['revision', 'Revisión'],
      ['estrategia', 'Estrategia'],
    ]);
  });
  it('proyecto sin nada: Evidencia pendiente y los demás bloqueados', () => {
    expect(states({})).toEqual(['Pendiente', 'Bloqueado', 'Bloqueado', 'Bloqueado']);
  });
  it('con respuestas pero sin evidencia: Evidencia en curso', () => {
    expect(states({ hasAnswers: true })).toEqual(['En curso', 'Bloqueado', 'Bloqueado', 'Bloqueado']);
  });
  it('con evidencia: Evidencia completada y Diagnóstico pendiente', () => {
    expect(states({ evidenceCount: 3 })).toEqual(['Completado', 'Pendiente', 'Bloqueado', 'Bloqueado']);
  });
  it('diagnóstico generado sin revisar: Diagnóstico en curso, Revisión pendiente', () => {
    expect(states({ evidenceCount: 3, diagnosis: 'generated' })).toEqual(['Completado', 'En curso', 'Pendiente', 'Bloqueado']);
  });
  it('revisión a medias: Revisión en curso', () => {
    expect(states({ evidenceCount: 3, diagnosis: 'generated', reviewed: 3 })).toEqual(['Completado', 'En curso', 'En curso', 'Bloqueado']);
  });
  it('diagnóstico emitido: Diagnóstico y Revisión completados, Estrategia pendiente', () => {
    expect(states({ evidenceCount: 3, diagnosis: 'issued', reviewed: 8 })).toEqual(['Completado', 'Completado', 'Completado', 'Pendiente']);
  });
  it('estrategia generada: en curso; enviada: completada', () => {
    expect(states({ evidenceCount: 3, diagnosis: 'issued', strategy: 'generated' })[3]).toBe('En curso');
    expect(states({ evidenceCount: 3, diagnosis: 'issued', strategy: 'sent' })[3]).toBe('Completado');
  });
});
