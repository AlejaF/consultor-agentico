// Lote D2 · T142 (AG-031 puntos 5, 7, 8 y 10; FR-057; FR-058 solo en modo real).
import { describe, expect, it } from 'vitest';
import { TEAMS } from '../../src/data/teams';
import {
  MATURITY_INDEX_LABEL,
  averageMaturity,
  backedFindings,
  basedOnText,
  evaluateMaturity,
  maturityIndex,
  maturityOf,
  projectMaturity,
  teamMaturity,
} from '../../src/domain/maturity';
import { createInitialState } from '../../src/state/initial';
import type { Decision, PersistedState, RealFinding, RealMaturityLevel } from '../../src/state/types';

const finding = (id: string, dimension: RealFinding['dimension'], verified = true): RealFinding => ({
  id, dimension, title: id, text: id, verified, ...(verified ? {} : { unverifiedReason: 'x' }), citations: [], origin: 'agent',
});
const lvl = (dimension: RealMaturityLevel['dimension'], level: number, derivesFrom: string[]): RealMaturityLevel => ({
  dimension, level: level as RealMaturityLevel['level'], insufficient: false, justification: 'Justificación.', derivesFrom,
});
const none = (dimension: RealMaturityLevel['dimension']): RealMaturityLevel => ({ dimension, level: null, insufficient: true, justification: '', derivesFrom: [] });
const FINDINGS = [finding('R1', 'datos'), finding('R2', 'datos'), finding('R3', 'estrategia'), finding('R4', 'gobernanza', false)];
const LEVELS: RealMaturityLevel[] = [lvl('estrategia', 4, ['R3']), none('infraestructura'), lvl('datos', 2, ['R1', 'R2']), lvl('gobernanza', 5, ['R4']), none('talento'), none('cultura')];
const D = (o: Record<string, Decision['state']>): Record<string, Decision> => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === 'edited' ? { state: 'edited', text: 'x' } : { state: v }])) as Record<string, Decision>;

function realProject(overrides: { decisions?: Record<string, Decision>; maturity?: RealMaturityLevel[]; status?: 'generated' | 'issued'; findings?: RealFinding[] } = {}): PersistedState['projects'][string] {
  return {
    answers: {}, localFiles: [], strategy: { status: 'none' }, mode: 'real',
    diagnosis: { status: overrides.status ?? 'issued', decisions: overrides.decisions ?? {} },
    real: { findings: overrides.findings ?? FINDINGS, missingInfo: [], objections: [], maturity: overrides.maturity ?? LEVELS },
  } as PersistedState['projects'][string];
}

describe('respaldo vigente (misma lógica que FR-025)', () => {
  it('cuenta solo hallazgos aceptados o editados y verificados', () => {
    const f = FINDINGS;
    expect(backedFindings(LEVELS[2]!, f, D({ R1: 'accepted', R2: 'edited' }))).toEqual(['R1', 'R2']);
    expect(backedFindings(LEVELS[2]!, f, D({ R1: 'accepted', R2: 'rejected' }))).toEqual(['R1']);
    expect(backedFindings(LEVELS[2]!, f, D({ R1: 'pending', R2: 'rejected' }))).toEqual([]);
    expect(backedFindings(LEVELS[2]!, f, {})).toEqual([]); // sin decisión = pendiente: no cuenta
  });
  it('un hallazgo NO VERIFICADO aceptado no cuenta, y un id que no existe tampoco', () => {
    expect(backedFindings(LEVELS[3]!, FINDINGS, D({ R4: 'accepted' }))).toEqual([]);
    expect(backedFindings(lvl('datos', 3, ['R99', 'R1']), FINDINGS, D({ R1: 'accepted' }))).toEqual(['R1']);
  });
});

describe('maturityIndex', () => {
  it('es el promedio de los niveles con respaldo vigente; los demás no entran', () => {
    // estrategia 4 (R3 aceptado) y datos 2 (R1 aceptado); gobernanza 5 cita un NO VERIFICADO: fuera.
    expect(maturityIndex(LEVELS, FINDINGS, D({ R1: 'accepted', R3: 'edited', R4: 'accepted' }))).toBe(3);
  });
  it('«sin evidencia suficiente» y «sin respaldo vigente» no entran (ni como 0 ni con su nivel propuesto)', () => {
    const ev = evaluateMaturity(LEVELS, FINDINGS, D({ R1: 'accepted' }));
    expect(ev.index).toBe(2); // solo datos
    const by = Object.fromEntries(ev.levels.map((l) => [l.dimension, l.status]));
    expect(by).toEqual({ estrategia: 'no-backing', infraestructura: 'insufficient', datos: 'backed', gobernanza: 'no-backing', talento: 'insufficient', cultura: 'insufficient' });
  });
  it('si la persona rechaza todos los hallazgos de un nivel, ese nivel sale del promedio y el índice se recalcula', () => {
    expect(maturityIndex(LEVELS, FINDINGS, D({ R1: 'accepted', R3: 'accepted' }))).toBe(3);
    expect(maturityIndex(LEVELS, FINDINGS, D({ R1: 'accepted', R3: 'rejected' }))).toBe(2);
    const ev = evaluateMaturity(LEVELS, FINDINGS, D({ R1: 'accepted', R3: 'rejected' }));
    expect(ev.levels.find((l) => l.dimension === 'estrategia')).toMatchObject({ status: 'no-backing', reason: 'rejected' });
  });
  it('un nivel cuyos hallazgos siguen sin revisar queda «sin respaldo vigente» por pendiente', () => {
    const ev = evaluateMaturity(LEVELS, FINDINGS, D({ R1: 'accepted' }));
    expect(ev.levels.find((l) => l.dimension === 'estrategia')).toMatchObject({ status: 'no-backing', reason: 'pending' });
  });
  it('sin ningún nivel con respaldo → null («—»), y sin maturity guardada también', () => {
    expect(maturityIndex(LEVELS, FINDINGS, {})).toBeNull();
    expect(maturityIndex(undefined, FINDINGS, D({ R1: 'accepted' }))).toBeNull();
    expect(evaluateMaturity(undefined, FINDINGS, {}).levels.map((l) => l.status)).toEqual(Array(6).fill('insufficient'));
  });
  it('«basado en N» cuenta solo hallazgos con respaldo vigente, con concordancia', () => {
    const ev = evaluateMaturity(LEVELS, FINDINGS, D({ R1: 'accepted', R2: 'accepted', R3: 'accepted' }));
    expect(ev.levels.find((l) => l.dimension === 'datos')).toMatchObject({ basedOn: 2, backing: ['R1', 'R2'] });
    expect(ev.levels.find((l) => l.dimension === 'estrategia')).toMatchObject({ basedOn: 1 });
    expect(basedOnText(1)).toBe('basado en 1 hallazgo');
    expect(basedOnText(2)).toBe('basado en 2 hallazgos');
    const one = evaluateMaturity(LEVELS, FINDINGS, D({ R1: 'accepted', R2: 'rejected' }));
    expect(one.levels.find((l) => l.dimension === 'datos')).toMatchObject({ basedOn: 1 });
  });
  it('siempre devuelve las seis dimensiones en el orden de la 001', () => {
    expect(evaluateMaturity(LEVELS, FINDINGS, {}).levels.map((l) => l.dimension)).toEqual(['estrategia', 'infraestructura', 'datos', 'gobernanza', 'talento', 'cultura']);
  });
  it('el rótulo del índice real es el acordado', () => {
    expect(MATURITY_INDEX_LABEL).toBe('Calculado por código a partir de niveles propuestos por IA');
  });
});

describe('projectMaturity y promedios', () => {
  it('un proyecto real emitido devuelve el índice calculado; no emitido, null', () => {
    const s = createInitialState();
    s.projects['P-A'] = realProject({ decisions: D({ R1: 'accepted', R3: 'accepted' }) });
    expect(projectMaturity(s, 'P-A')).toBe(3);
    s.projects['P-A'] = realProject({ status: 'generated', decisions: D({ R1: 'accepted', R3: 'accepted' }) });
    expect(projectMaturity(s, 'P-A')).toBeNull();
  });
  it('un proyecto real emitido sin niveles con respaldo vigente da null («—»)', () => {
    const s = createInitialState();
    s.projects['P-A'] = realProject({ decisions: D({ R2: 'accepted' }), maturity: [none('datos')] });
    expect(projectMaturity(s, 'P-A')).toBeNull();
  });
  it('EL ÍNDICE SIMULADO NO CAMBIA: valores sembrados, plantilla y promedio 2,5 (FR-058 solo cambia en modo real)', () => {
    const s = createInitialState();
    expect(['P-B', 'P-C', 'E-2', 'E-3'].map((id) => projectMaturity(s, id))).toEqual([2.4, 3.1, 1.8, 2.8]);
    expect(projectMaturity(s, 'E-1')).toBe(maturityOf('E-1'));
    expect(averageMaturity(s)).toBeCloseTo(2.5, 10);
    s.projects['P-A'].diagnosis = { status: 'issued', decisions: {} };
    expect(projectMaturity(s, 'P-A')).toBe(maturityOf('P-A'));
  });
  it('los proyectos reales emitidos con índice entran al promedio del equipo y al total; los de «—» no', () => {
    const s = createInitialState();
    s.projects['P-A'] = realProject({ decisions: D({ R1: 'accepted', R3: 'accepted' }) }); // índice 3
    const team = TEAMS.find((t) => t.projectIds.includes('P-A'))!;
    const sims = team.projectIds.filter((id) => id !== 'P-A').map((id) => projectMaturity(s, id)).filter((v): v is number => v !== null);
    expect(teamMaturity(s, team)).toBeCloseTo([...sims, 3].reduce((a, b) => a + b, 0) / (sims.length + 1), 10);
    const total = averageMaturity(s)!;
    s.projects['P-A'] = realProject({ decisions: {} }); // emitido pero sin respaldo: «—»
    expect(averageMaturity(s)).not.toBeCloseTo(total, 5);
    const others = Object.keys(s.projects).map((id) => projectMaturity(s, id)).filter((v): v is number => v !== null);
    expect(averageMaturity(s)).toBeCloseTo(others.reduce((a, b) => a + b, 0) / others.length, 10);
  });
});
