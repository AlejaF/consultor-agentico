import { describe, expect, it } from 'vitest';
import { DIAGNOSIS } from '../../src/data/diagnosis';
import { TEAMS } from '../../src/data/teams';
import { averageMaturity, maturityOf, teamMaturity, teamMatches } from '../../src/domain/maturity';
import { createInitialState } from '../../src/state/initial';

describe('madurez derivada de los diagnósticos emitidos (FR-057)', () => {
  it('cada proyecto con diagnóstico emitido muestra su valor sembrado (ilustrativo); P-A y los demás, el de la plantilla', () => {
    expect(maturityOf('P-B')).toBe(2.4);
    expect(maturityOf('P-C')).toBe(3.1);
    expect(maturityOf('E-2')).toBe(1.8);
    expect(maturityOf('E-3')).toBe(2.8);
    expect(maturityOf('E-1')).toBe(DIAGNOSIS.maturityIndex);
    expect(maturityOf('P-A')).toBe(DIAGNOSIS.maturityIndex);
  });
  it('un equipo promedia los diagnósticos emitidos de sus proyectos', () => {
    const s = createInitialState();
    expect(teamMaturity(s, TEAMS[0])).toBeCloseTo(2.75, 10); // P-B 2,4 y P-C 3,1
    expect(teamMaturity(s, TEAMS[1])).toBeCloseTo(2.4, 10);
    expect(teamMaturity(s, TEAMS[2])).toBeCloseTo(1.8, 10);
    expect(teamMaturity(s, TEAMS[3])).toBeCloseTo(2.8, 10);
  });
  it('el promedio del tablero con los datos de ejemplo es 2,5 (valores distintos por proyecto)', () => {
    expect(averageMaturity(createInitialState())).toBeCloseTo(2.5, 10);
  });
  it('un diagnóstico que se emite en la sesión (P-A) entra al promedio con el valor de la plantilla', () => {
    const s = createInitialState();
    s.projects['P-A'].diagnosis = { status: 'issued', decisions: {} };
    expect(averageMaturity(s)).toBeCloseTo((2.4 + 3.1 + 2.4 + 1.8 + 2.8 + 2.4) / 6, 10);
  });
  it('los equipos sin diagnóstico emitido no cuentan en el promedio (no valen cero)', () => {
    const s = createInitialState();
    for (const id of ['E-1', 'E-2', 'E-3']) s.projects[id].diagnosis = { status: 'none', decisions: {} };
    expect(averageMaturity(s)).toBeCloseTo((2.4 + 3.1) / 2, 10);
  });
  it('sin diagnóstico emitido en ningún proyecto del equipo, no hay madurez («—»)', () => {
    const s = createInitialState();
    s.projects['E-3'].diagnosis = { status: 'generated', decisions: {} };
    expect(teamMaturity(s, TEAMS[3])).toBeNull();
  });
  it('sin ningún diagnóstico emitido, el promedio es nulo', () => {
    const s = createInitialState();
    for (const p of Object.values(s.projects)) p.diagnosis = { status: 'none', decisions: {} };
    expect(averageMaturity(s)).toBeNull();
  });
});

describe('buscador de equipos', () => {
  it('coincide por equipo o empresa, sin mayúsculas ni tildes', () => {
    expect(teamMatches('equipo 1', 'Equipo 1', ['Empresa Ficticia Alfa'])).toBe(true);
    expect(teamMatches('EPSILON', 'Equipo 2', ['Empresa Ficticia Épsilon'])).toBe(true);
    expect(teamMatches('beta', 'Equipo 1', ['Empresa Ficticia Alfa', 'Empresa Ficticia Beta'])).toBe(true);
    expect(teamMatches('zzz', 'Equipo 1', ['Empresa Ficticia Alfa'])).toBe(false);
  });
  it('una búsqueda vacía o de solo espacios coincide con todo', () => {
    expect(teamMatches('   ', 'Equipo 1', [])).toBe(true);
  });
});
