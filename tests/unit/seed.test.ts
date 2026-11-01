import { describe, expect, it } from 'vitest';
import { DIAGNOSIS } from '../../src/data/diagnosis';
import { PROJECTS } from '../../src/data/projects';
import { TEAMS } from '../../src/data/teams';
import { canIssue } from '../../src/domain/review';
import { CATALOGS, createInitialState } from '../../src/state/initial';
import { isValidShape } from '../../src/state/persistence';

const IDS = DIAGNOSIS.findings.map((f) => f.id);
const UNVERIFIED = DIAGNOSIS.findings.find((f) => !f.verified)!.id;
const initial = createInitialState();

describe('estados iniciales sembrados', () => {
  it('el estado inicial completo pasa la validación de forma de la persistencia', () => {
    expect(isValidShape(JSON.parse(JSON.stringify(initial)), CATALOGS)).toBe(true);
  });
  it('el catálogo de hallazgos coincide con la plantilla', () => {
    expect([...CATALOGS.findingIds].sort()).toEqual([...IDS].sort());
  });
  it('las decisiones sembradas referencian hallazgos existentes', () => {
    for (const p of Object.values(initial.projects)) {
      for (const id of Object.keys(p.diagnosis.decisions)) expect(IDS).toContain(id);
    }
  });
  it('P-A: evidencia completa y sin generar; P-D: sin evidencia', () => {
    expect(initial.projects['P-A'].diagnosis.status).toBe('none');
    expect(PROJECTS.find((p) => p.id === 'P-A')!.sampleSlots.length).toBeGreaterThan(0);
    expect(PROJECTS.find((p) => p.id === 'P-D')!.sampleSlots).toEqual([]);
    expect(initial.projects['P-D'].diagnosis.status).toBe('none');
    expect(initial.projects['P-D'].localFiles).toEqual([]);
  });
  it('P-B y P-C tienen el diagnóstico emitido y cumplen las reglas de emisión', () => {
    for (const id of ['P-B', 'P-C']) {
      const d = initial.projects[id].diagnosis;
      expect(d.status).toBe('issued');
      expect(d.issuedAt).toBeTruthy();
      expect(canIssue(IDS, d.decisions)).toBe(true);
    }
  });
  it('P-B tiene un aceptado NO VERIFICADO, uno editado con texto y uno rechazado', () => {
    const dec = initial.projects['P-B'].diagnosis.decisions;
    expect(dec[UNVERIFIED]).toEqual({ state: 'accepted' });
    const edited = Object.values(dec).filter((d) => d.state === 'edited');
    expect(edited.length).toBeGreaterThanOrEqual(1);
    for (const e of edited) expect(e.state === 'edited' && e.text.trim().length > 0).toBe(true);
    expect(Object.values(dec).filter((d) => d.state === 'rejected').length).toBeGreaterThanOrEqual(1);
    expect(initial.projects['P-B'].strategy.status).toBe('none');
  });
  it('los 3 equipos adicionales tienen el diagnóstico emitido', () => {
    for (const t of TEAMS.filter((x) => x.id !== 'T-0')) {
      for (const pid of t.projectIds) expect(initial.projects[pid].diagnosis.status).toBe('issued');
    }
  });
  it('los equipos se llaman «Equipo 1» a «Equipo 4»; el del Consultor es «Equipo 1»', () => {
    expect(TEAMS.map((t) => t.name)).toEqual(['Equipo 1', 'Equipo 2', 'Equipo 3', 'Equipo 4']);
    expect(TEAMS[0].projectIds).toEqual(['P-A', 'P-B', 'P-C', 'P-D']);
  });
});
