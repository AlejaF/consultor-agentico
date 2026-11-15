// Lote H4a (AG-036): rutas por hash con subruta para Resumen y Detalle, y vista inicial por variable de compilación.
import { describe, expect, it } from 'vitest';
import { ROUTES, matchRoute } from '../../src/app/router';
import { sectionTargetId, vistaHref, vistaInicial } from '../../src/app/vista';

const BASE = '#/consultor/proyectos/P-A/diagnostico';

describe('subrutas de Diagnóstico', () => {
  it('la ruta base sigue siendo la misma pantalla y no trae vista', () => {
    const m = matchRoute(BASE)!;
    expect(m.id).toBe('consultor.diagnosis');
    expect(m.params.vista).toBeUndefined();
  });
  it('/resumen y /detalle son la MISMA ruta de la tabla (sin identificadores nuevos) y traen la vista', () => {
    for (const v of ['resumen', 'detalle']) {
      const m = matchRoute(`${BASE}/${v}`)!;
      expect(m.id).toBe('consultor.diagnosis');
      expect(m.params.projectId).toBe('P-A');
      expect(m.params.vista).toBe(v);
      expect(m.role).toBe('consultor');
    }
    expect(ROUTES.map((r) => r.id).filter((id) => id === 'consultor.diagnosis')).toHaveLength(1);
    expect(ROUTES).toHaveLength(14);
  });
  it('el detalle admite una sección y la entrega como parámetro', () => {
    expect(matchRoute(`${BASE}/detalle/pilar-datos`)!.params.seccion).toBe('pilar-datos');
    expect(matchRoute(`${BASE}/detalle/hallazgos`)!.params.seccion).toBe('hallazgos');
  });
  it('lo demás sigue siendo una ruta desconocida', () => {
    expect(matchRoute(`${BASE}/otra`)).toBeNull();
    expect(matchRoute(`${BASE}/resumen/hallazgos`)).toBeNull(); // el resumen no lleva sección
    expect(matchRoute(`${BASE}/detalle/a/b`)).toBeNull();
    expect(matchRoute('#/consultor/proyectos/P-A/revision/resumen')).toBeNull(); // Revisión no tiene vistas
  });
});

describe('vista inicial y enlaces', () => {
  it('sin variable de compilación la vista inicial es «resumen» (producción)', () => {
    expect(vistaInicial()).toBe('resumen');
  });
  it('vistaHref arma la ruta de cada vista y la sección', () => {
    expect(vistaHref('P-A', 'resumen')).toBe(`${BASE}/resumen`);
    expect(vistaHref('P-A', 'detalle')).toBe(`${BASE}/detalle`);
    expect(vistaHref('P-A', 'detalle', 'pilar-datos')).toBe(`${BASE}/detalle/pilar-datos`);
  });
  it('cada sección apunta al encabezado que existe en el Detalle', () => {
    expect(sectionTargetId('pilar-datos', ['datos'])).toBe('dim-datos');
    expect(sectionTargetId('pilar-estrategia', ['datos'])).toBe('madurez-titulo'); // pilar sin hallazgos: no tiene encabezado propio
    expect(sectionTargetId('hallazgos', ['datos', 'talento'])).toBe('dim-datos');
    expect(sectionTargetId('cobertura', [])).toBe('cobertura-titulo');
    expect(sectionTargetId('evidencia-sugerida', [])).toBe('falta-titulo');
    expect(sectionTargetId(undefined, [])).toBeNull();
  });
});
