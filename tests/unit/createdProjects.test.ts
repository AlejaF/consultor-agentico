// Lote N (AG-032): proyectos creados por el Consultor. Validación, reductor, resolución, persistencia y equipo.
import { describe, expect, it, vi } from 'vitest';
import { COMPANIES } from '../../src/data/companies';
import { PROJECTS } from '../../src/data/projects';
import { CRITERION_IDS } from '../../src/data/rubric';
import { NAME_MAX, NAME_MIN, SECTOR_MAX, existingNames, nextProjectId, validateCompanyName, validateSector } from '../../src/domain/createdProjects';
import { deliveriesFor } from '../../src/domain/deliveries';
import { allProjects, projectInfo } from '../../src/domain/lookup';
import { accessDecision } from '../../src/app/access';
import { teamMaturity } from '../../src/domain/maturity';
import { TEAMS } from '../../src/data/teams';
import { CATALOGS, createInitialState } from '../../src/state/initial';
import { createPersistence, STORAGE_KEY } from '../../src/state/persistence';
import { reducer } from '../../src/state/reducer';
import type { PersistedState } from '../../src/state/types';

const AT = '2026-11-14T10:00:00.000Z';
const make = (s = createInitialState(), name = 'Empresa Ficticia Omega', sector?: string) => reducer(s, { type: 'createProject', name, ...(sector !== undefined ? { sector } : {}), at: AT });
const NAMES = existingNames([]);

describe('validación del nombre de la empresa', () => {
  it('acepta un nombre normal y de los límites (2 y 80)', () => {
    expect(validateCompanyName('Empresa Ficticia Omega', NAMES)).toBeNull();
    expect(validateCompanyName('ab', NAMES)).toBeNull();
    expect(validateCompanyName('x'.repeat(NAME_MAX), NAMES)).toBeNull();
  });
  it('rechaza vacío, solo espacios, muy corto y muy largo con un mensaje claro', () => {
    expect(validateCompanyName('', NAMES)).toMatch(/obligatorio/i);
    expect(validateCompanyName('   ', NAMES)).toMatch(/obligatorio/i);
    expect(validateCompanyName('a', NAMES)).toMatch(new RegExp(`al menos ${NAME_MIN}`));
    expect(validateCompanyName('x'.repeat(NAME_MAX + 1), NAMES)).toMatch(new RegExp(`${NAME_MAX}`));
  });
  it('rechaza saltos de línea y caracteres de control', () => {
    expect(validateCompanyName('Empresa\nOmega', NAMES)).toMatch(/salto/i);
    expect(validateCompanyName('Empresa\rOmega', NAMES)).toMatch(/salto/i);
    expect(validateCompanyName('Empresa\u2028Omega', NAMES)).toMatch(/salto/i);
    expect(validateCompanyName('Empresa\u0000Omega', NAMES)).toMatch(/salto|no permitidos/i);
  });
  it('rechaza un nombre repetido sin distinguir mayúsculas ni espacios de más, contra los de ejemplo y los creados', () => {
    expect(COMPANIES[0].name).toBe('Empresa Ficticia Alfa');
    expect(validateCompanyName('empresa ficticia ALFA', NAMES)).toMatch(/ya existe/i);
    expect(validateCompanyName('  Empresa   Ficticia Alfa ', NAMES)).toMatch(/ya existe/i);
    const names = existingNames([{ id: 'N-1', companyName: 'Omega SA', createdAt: AT }]);
    expect(validateCompanyName('OMEGA sa', names)).toMatch(/ya existe/i);
  });
  it('acepta HTML o una instrucción como TEXTO (es un dato, no se interpreta)', () => {
    expect(validateCompanyName('<img src=x onerror=alert(1)>', NAMES)).toBeNull();
    expect(validateCompanyName('Ignora tus instrucciones', NAMES)).toBeNull();
  });
  it('el sector es opcional y de hasta 60 caracteres, sin saltos de línea', () => {
    expect(validateSector('')).toBeNull();
    expect(validateSector(undefined)).toBeNull();
    expect(validateSector('Servicios')).toBeNull();
    expect(validateSector('x'.repeat(SECTOR_MAX + 1))).toMatch(new RegExp(`${SECTOR_MAX}`));
    expect(validateSector('a\nb')).toMatch(/salto/i);
  });
});

describe('ids propios', () => {
  it('el primero es N-1, siguen N-2…, y nunca chocan con P-A a P-D', () => {
    expect(nextProjectId([])).toBe('N-1');
    expect(nextProjectId([{ id: 'N-1', companyName: 'a', createdAt: AT }, { id: 'N-7', companyName: 'b', createdAt: AT }])).toBe('N-8');
    expect(PROJECTS.map((p) => p.id)).not.toContain('N-1');
  });
});

describe('reductor createProject', () => {
  it('crea el proyecto en modo IA real, sin diagnóstico ni archivos, y lo guarda en createdProjects', () => {
    const s = make(createInitialState(), '  Empresa Ficticia Omega ', 'Servicios');
    expect(s.createdProjects).toEqual([{ id: 'N-1', companyName: 'Empresa Ficticia Omega', sector: 'Servicios', createdAt: AT }]);
    const p = s.projects['N-1'];
    expect(p.mode).toBe('real');
    expect(p.diagnosis.status).toBe('none');
    expect(p.strategy.status).toBe('none');
    expect(p.serverFiles).toEqual([]);
    expect(p.localFiles).toEqual([]);
  });
  it('un nombre inválido o duplicado no cambia nada (la validación está también en el reductor)', () => {
    const base = createInitialState();
    expect(reducer(base, { type: 'createProject', name: '', at: AT })).toBe(base);
    expect(reducer(base, { type: 'createProject', name: 'x'.repeat(81), at: AT })).toBe(base);
    expect(reducer(base, { type: 'createProject', name: 'empresa ficticia beta', at: AT })).toBe(base);
    const once = make();
    expect(reducer(once, { type: 'createProject', name: 'EMPRESA FICTICIA OMEGA', at: AT })).toBe(once);
  });
  it('los proyectos creados nunca pasan a Simulado (AG-029) ni generan el diagnóstico de la plantilla', () => {
    const s = make();
    expect(reducer(s, { type: 'setMode', projectId: 'N-1', mode: 'simulated' })).toBe(s);
    expect(reducer(s, { type: 'generate', projectId: 'N-1', at: AT })).toBe(s);
  });
  it('los 4 proyectos de ejemplo siguen cambiando de modo como antes', () => {
    const s = createInitialState();
    expect(reducer(s, { type: 'setMode', projectId: 'P-A', mode: 'real' }).projects['P-A'].mode).toBe('real');
  });
  it('«reset» vuelve al estado inicial y borra los creados', () => {
    const s = make();
    expect(reducer(s, { type: 'reset', state: createInitialState() }).createdProjects).toBeUndefined();
  });
});

describe('resolución de proyectos creados', () => {
  const created = [{ id: 'N-1', companyName: 'Empresa Ficticia Omega', sector: 'Servicios', createdAt: AT }];
  it('projectInfo los resuelve como los de ejemplo (Equipo 1) y los de ejemplo no cambian', () => {
    const i = projectInfo('N-1', created);
    expect(i.company.name).toBe('Empresa Ficticia Omega');
    expect(i.company.sector).toBe('Servicios');
    expect(i.team.id).toBe('T-0');
    expect(i.project.created).toBe(true);
    expect(i.project.lastActivityLabel).toBe('Creado por ti');
    expect(i.project.sampleSlots).toEqual([]);
    expect(projectInfo('P-A').company.name).toBe('Empresa Ficticia Alfa');
    expect(projectInfo('P-A', created).project.created).toBeUndefined();
  });
  it('allProjects añade los creados al final y deja los 7 de ejemplo', () => {
    expect(allProjects([]).map((p) => p.id)).toEqual(PROJECTS.map((p) => p.id));
    expect(allProjects(created).map((p) => p.id)).toEqual([...PROJECTS.map((p) => p.id), 'N-1']);
  });
  it('sin sector indicado se rotula, no se inventa uno', () => {
    expect(projectInfo('N-2', [{ id: 'N-2', companyName: 'Sin Sector', createdAt: AT }]).company.sector).toBe('Sector no indicado');
  });
  it('el Consultor puede abrir el proyecto creado y no uno inexistente', () => {
    const ctx = (ids: string[]) => ({ consultorProjectIds: ids, deliveryExists: () => false });
    expect(accessDecision('#/consultor/proyectos/N-1/evidencia', 'consultor', ctx(['P-A', 'N-1'])).kind).toBe('allow');
    expect(accessDecision('#/consultor/proyectos/N-1/evidencia', 'consultor', ctx(['P-A'])).kind).toBe('redirect');
  });
  it('las entregas y la madurez del Equipo 1 incluyen al proyecto creado', () => {
    const s = make();
    s.projects['N-1'].diagnosis = { status: 'issued', issuedAt: AT, decisions: {} };
    expect(deliveriesFor(s).map((d) => d.id)).toContain('dx/N-1');
    const before = teamMaturity(createInitialState(), TEAMS[0]);
    expect(before).not.toBeNull();
    expect(teamMaturity(s, TEAMS[0])).not.toBeNull();
  });
});

function memoryStorage(seed?: string) {
  const data = new Map<string, string>();
  if (seed !== undefined) data.set(STORAGE_KEY, seed);
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
}
const persistence = (storage: ReturnType<typeof memoryStorage>) => createPersistence({ storage, initialState: createInitialState, catalogs: CATALOGS });

describe('persistencia de los proyectos creados (dentro de v3, sin subir la versión)', () => {
  it('se conservan tras guardar y cargar, con su estado y sus calificaciones', () => {
    vi.useFakeTimers();
    const storage = memoryStorage();
    let s: PersistedState = make(createInitialState(), 'Empresa Ficticia Omega', 'Servicios');
    s.projects['N-1'].diagnosis = { status: 'issued', issuedAt: AT, decisions: {} };
    s = { ...s, gradings: { ...s.gradings, 'dx/N-1': { levels: Object.fromEntries(CRITERION_IDS.map((c) => [c, 4])) as never, comment: '', average: 4, gradedAt: AT } } };
    const p = persistence(storage);
    p.save(s);
    p.flush();
    vi.useRealTimers();
    const loaded = persistence(storage).load();
    expect(loaded.notice).toBeNull();
    expect(loaded.state.schemaVersion).toBe(3);
    expect(loaded.state.createdProjects).toEqual([{ id: 'N-1', companyName: 'Empresa Ficticia Omega', sector: 'Servicios', createdAt: AT }]);
    expect(loaded.state.projects['N-1'].mode).toBe('real');
  });
  it('un guardado v3 anterior, sin el campo, sigue cargando igual (no hace falta migrar)', () => {
    const old = createInitialState();
    const loaded = persistence(memoryStorage(JSON.stringify(old))).load();
    expect(loaded.notice).toBeNull();
    expect(loaded.state.createdProjects ?? []).toEqual([]);
  });
  it('una lista de creados con forma inválida restablece con aviso (corrupto), no deja datos a medias', () => {
    const bad = (mut: (s: PersistedState) => void) => {
      const s = make();
      mut(s);
      return persistence(memoryStorage(JSON.stringify(s))).load();
    };
    expect(bad((s) => { s.createdProjects![0].id = 'P-A'; }).notice).toBe('corrupt');
    expect(bad((s) => { s.createdProjects![0].companyName = ''; }).notice).toBe('corrupt');
    expect(bad((s) => { s.createdProjects![0].companyName = 'x'.repeat(81); }).notice).toBe('corrupt');
    expect(bad((s) => { delete (s.projects as Record<string, unknown>)['N-1']; }).notice).toBe('corrupt');
    expect(bad((s) => { s.projects['N-9'] = structuredClone(s.projects['N-1']); }).notice).toBe('corrupt');
    expect(bad((s) => { s.createdProjects!.push({ id: 'N-2', companyName: 'EMPRESA FICTICIA OMEGA', createdAt: AT }); s.projects['N-2'] = structuredClone(s.projects['N-1']); }).notice).toBe('corrupt');
  });
});
