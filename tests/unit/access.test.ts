import { describe, expect, it } from 'vitest';
import { homeOf, matchRoute } from '../../src/app/router';
import { accessDecision, type AccessContext } from '../../src/app/access';

const ctx: AccessContext = {
  consultorProjectIds: ['P-A', 'P-B', 'P-C', 'P-D'],
  deliveryExists: (tipo, id) => (tipo === 'dx' ? ['P-B', 'P-C', 'E-1'].includes(id) : id === 'P-C'),
};
const NOT_FOUND = 'No encontramos esa pantalla.';

describe('tabla de rutas (contracts/routes.md)', () => {
  const cases: [string, string, Record<string, string>][] = [
    ['#/', 'login', {}],
    ['#/consultor', 'consultor.projects', {}],
    ['#/consultor/proyectos/P-A/evidencia', 'consultor.evidence', { projectId: 'P-A' }],
    ['#/consultor/proyectos/P-A/diagnostico', 'consultor.diagnosis', { projectId: 'P-A' }],
    ['#/consultor/proyectos/P-A/revision', 'consultor.review', { projectId: 'P-A' }],
    ['#/consultor/proyectos/P-B/estrategia', 'consultor.strategy', { projectId: 'P-B' }],
    ['#/consultor/proyectos/P-B/informe', 'consultor.report', { projectId: 'P-B' }],
    ['#/lider', 'lider.dashboard', {}],
    ['#/lider/entregas', 'lider.deliveries', {}],
    ['#/lider/entregas/dx/P-B', 'lider.delivery', { tipo: 'dx', projectId: 'P-B' }],
    ['#/lider/entregas/st/P-C/informe', 'lider.deliveryReport', { tipo: 'st', projectId: 'P-C' }],
    ['#/contacto', 'contacto.summary', {}],
    ['#/contacto/encuesta', 'contacto.survey', {}],
  ];
  it.each(cases)('%s → %s', (hash, id, params) => {
    const m = matchRoute(hash);
    expect(m?.id).toBe(id);
    expect(m?.params).toEqual(params);
  });
  it('rutas desconocidas no coinciden', () => {
    expect(matchRoute('#/nada')).toBeNull();
    expect(matchRoute('#/consultor/proyectos/P-A')).toBeNull();
  });
  it('el hash vacío equivale a #/', () => {
    expect(matchRoute('')?.id).toBe('login');
  });
  it('inicio de cada rol', () => {
    expect(homeOf('consultor')).toBe('#/consultor');
    expect(homeOf('lider')).toBe('#/lider');
    expect(homeOf('contacto')).toBe('#/contacto');
  });
});

describe('regla de redirección (5 reglas)', () => {
  it('1. sin rol y ruta ≠ #/ → #/ sin aviso', () => {
    expect(accessDecision('#/lider', null, ctx)).toEqual({ kind: 'redirect', to: '#/' });
  });
  it('1b. sin rol y #/ → mostrar el ingreso', () => {
    expect(accessDecision('#/', null, ctx).kind).toBe('allow');
  });
  it('2. con rol y #/ → inicio del rol', () => {
    // «Inicio»: con un rol activo se muestra el ingreso sin borrar el estado
    expect(accessDecision('#/', 'lider', ctx).kind).toBe('allow');
  });
  it('3. ruta de otro rol → inicio con aviso', () => {
    expect(accessDecision('#/lider', 'consultor', ctx)).toEqual({
      kind: 'redirect',
      to: '#/consultor',
      notice: 'Esa vista pertenece al rol Líder. Estás como Consultor.',
    });
    expect(accessDecision('#/consultor', 'contacto', ctx)).toEqual({
      kind: 'redirect',
      to: '#/contacto',
      notice: 'Esa vista pertenece al rol Consultor. Estás como Contacto de la empresa.',
    });
  });
  it('4. ruta desconocida → inicio con aviso', () => {
    expect(accessDecision('#/xyz', 'consultor', ctx)).toEqual({
      kind: 'redirect',
      to: '#/consultor',
      notice: NOT_FOUND,
    });
  });
  it('4. :projectId inexistente', () => {
    expect(accessDecision('#/consultor/proyectos/P-Z/evidencia', 'consultor', ctx)).toMatchObject({
      kind: 'redirect',
      notice: NOT_FOUND,
    });
  });
  it('4. :tipo distinto de dx/st', () => {
    expect(accessDecision('#/lider/entregas/xx/P-B', 'lider', ctx)).toMatchObject({
      kind: 'redirect',
      to: '#/lider',
      notice: NOT_FOUND,
    });
  });
  it('4. entrega que aún no existe (st sin estrategia enviada)', () => {
    expect(accessDecision('#/lider/entregas/st/P-A', 'lider', ctx)).toMatchObject({
      kind: 'redirect',
      notice: NOT_FOUND,
    });
    expect(accessDecision('#/lider/entregas/st/P-C/informe', 'lider', ctx).kind).toBe('allow');
  });
  it('5. ruta válida del rol → mostrar', () => {
    const r = accessDecision('#/lider/entregas/dx/P-B', 'lider', ctx);
    expect(r.kind).toBe('allow');
    if (r.kind === 'allow') expect(r.route.params).toEqual({ tipo: 'dx', projectId: 'P-B' });
    expect(accessDecision('#/consultor/proyectos/P-D/evidencia', 'consultor', ctx).kind).toBe('allow');
    expect(accessDecision('#/contacto/encuesta', 'contacto', ctx).kind).toBe('allow');
  });
  it('5a. la lista de entregas es del Líder', () => {
    expect(accessDecision('#/lider/entregas', 'lider', ctx).kind).toBe('allow');
    expect(accessDecision('#/lider/entregas', 'consultor', ctx)).toMatchObject({ notice: 'Esa vista pertenece al rol Líder. Estás como Consultor.' });
  });
  it('5b. el informe exige el mismo permiso', () => {
    expect(accessDecision('#/lider/entregas/dx/P-B/informe', 'consultor', ctx)).toMatchObject({
      notice: 'Esa vista pertenece al rol Líder. Estás como Consultor.',
    });
  });
});
