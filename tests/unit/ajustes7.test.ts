import { describe, expect, it } from 'vitest';
import { ROLE_LABEL } from '../../src/app/router';
import { INITIAL_GRADINGS } from '../../src/data/projects';
import { blockedStrategyLink } from '../../src/domain/flow';
import { formatScore } from '../../src/domain/format';
import { averageOfGradings } from '../../src/domain/rubric';
import type { Grading } from '../../src/state/types';

describe('Ajuste 2: destino del bloqueo de Estrategia', () => {
  it('sin diagnóstico generado: «Ir al diagnóstico»; generado y sin emitir: «Ir a la revisión»', () => {
    expect(blockedStrategyLink('none')).toEqual({ label: 'Ir al diagnóstico', step: 'diagnostico' });
    expect(blockedStrategyLink('generated')).toEqual({ label: 'Ir a la revisión', step: 'revision' });
  });
});

describe('Ajuste 3: promedio de calificaciones del tablero', () => {
  it('es la media de los promedios guardados (de ejemplo y de la sesión) y se muestra con coma', () => {
    expect(averageOfGradings({})).toBeNull();
    const seeded = averageOfGradings(INITIAL_GRADINGS)!;
    expect(formatScore(seeded)).toBe('4,2');
    const session: Grading = { levels: {}, comment: 'x', average: 1, gradedAt: '2026-11-01T10:00:00.000Z' };
    const withSession = averageOfGradings({ ...INITIAL_GRADINGS, 'dx/E-3': session })!;
    expect(withSession).toBeCloseTo((4.5 + 4.25 + 3.75 + 1) / 4, 10);
    expect(formatScore(withSession)).toBe('3,4');
  });
});

describe('Ajuste 7: nombre del rol', () => {
  it('«Contacto de la empresa»', () => {
    expect(ROLE_LABEL.contacto).toBe('Contacto de la empresa');
  });
});
