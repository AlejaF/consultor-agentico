// Lote H4b (AG-036): subrutas Resumen/Detalle de Estrategia y del Tablero, sin identificadores nuevos en la tabla de rutas.
import { describe, expect, it } from 'vitest';
import { ROUTES, matchRoute } from '../../src/app/router';
import { estrategiaHref, sectionTargetEstrategia, tableroHref } from '../../src/app/vista';

const EST = '#/consultor/proyectos/P-C/estrategia';

describe('subrutas de Estrategia', () => {
  it('la ruta base no trae vista; /resumen y /detalle son la MISMA ruta de la tabla', () => {
    expect(matchRoute(EST)!.params.vista).toBeUndefined();
    for (const v of ['resumen', 'detalle']) {
      const m = matchRoute(`${EST}/${v}`)!;
      expect(m.id).toBe('consultor.strategy');
      expect(m.params.projectId).toBe('P-C');
      expect(m.params.vista).toBe(v);
      expect(m.role).toBe('consultor');
    }
    expect(matchRoute(`${EST}/detalle/riesgo-r1`)!.params.seccion).toBe('riesgo-r1');
    expect(ROUTES).toHaveLength(14);
  });
  it('lo demás sigue siendo desconocido', () => {
    expect(matchRoute(`${EST}/resumen/riesgo-r1`)).toBeNull();
    expect(matchRoute(`${EST}/otra`)).toBeNull();
    expect(matchRoute('#/consultor/proyectos/P-C/informe/resumen')).toBeNull();
  });
  it('enlaces y destinos', () => {
    expect(estrategiaHref('P-C', 'detalle', 'riesgo-r1')).toBe(`${EST}/detalle/riesgo-r1`);
    expect(estrategiaHref('P-C', 'resumen', 'riesgo-r1')).toBe(`${EST}/resumen`); // el resumen no lleva sección
    expect(sectionTargetEstrategia('riesgos-ruta')).toBe('estr-riesgos');
    expect(sectionTargetEstrategia('trazabilidad')).toBe('trazabilidad-titulo');
    expect(sectionTargetEstrategia('riesgo-r1')).toBe('riesgo-r1');
    expect(sectionTargetEstrategia('fase-f2')).toBe('fase-f2');
    expect(sectionTargetEstrategia(undefined)).toBeNull();
    expect(sectionTargetEstrategia('x')).toBeNull();
  });
});

describe('subrutas del Tablero', () => {
  it('#/lider/resumen y #/lider/detalle son la misma ruta del Tablero; «entregas» no se confunde', () => {
    expect(matchRoute('#/lider')!.params.vista).toBeUndefined();
    for (const v of ['resumen', 'detalle']) {
      const m = matchRoute(`#/lider/${v}`)!;
      expect(m.id).toBe('lider.dashboard');
      expect(m.role).toBe('lider');
      expect(m.params.vista).toBe(v);
    }
    expect(matchRoute('#/lider/entregas')!.id).toBe('lider.deliveries');
    expect(matchRoute('#/lider/resumen/x')).toBeNull();
    expect(tableroHref('detalle')).toBe('#/lider/detalle');
  });
});
