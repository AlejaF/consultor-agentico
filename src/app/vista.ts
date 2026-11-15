// Vista Resumen / Detalle (AG-036, lote H4): la vista vive en la ruta por hash y la inicial se fija al compilar.
export type Vista = 'resumen' | 'detalle';

/**
 * Vista que abre la ruta base (sin subruta). Producción: «resumen». Los servidores de las suites e2e de la 001 y de la 002
 * compilan con VITE_VISTA_INICIAL=detalle para que las pruebas existentes verifiquen el Detalle sin cambiar ninguna aserción.
 */
export function vistaInicial(): Vista {
  return import.meta.env.VITE_VISTA_INICIAL === 'detalle' ? 'detalle' : 'resumen';
}

/** Dirección de una vista de Diagnóstico, con sección opcional (solo el Detalle la admite). */
export function vistaHref(projectId: string, vista: Vista, seccion?: string): string {
  const base = `#/consultor/proyectos/${projectId}/diagnostico/${vista}`;
  return vista === 'detalle' && seccion ? `${base}/${seccion}` : base;
}

/** Subruta de Diagnóstico: `<base>/resumen` o `<base>/detalle[/<sección>]` (no son rutas nuevas de la tabla). */
export const DIAGNOSIS_VIEW = /^(#\/consultor\/proyectos\/[^/]+\/diagnostico)\/(?:(resumen)|(detalle)(?:\/([a-z0-9-]+))?)$/;

/**
 * Id del encabezado al que lleva una sección del Detalle. «pilar-<dim>» lleva a su grupo de hallazgos o, si ese pilar no tiene
 * hallazgos (no hay encabezado propio), a «Madurez por dimensión»; «hallazgos» lleva al primer grupo.
 */
export function sectionTargetId(seccion: string | undefined, pillarsWithFindings: readonly string[]): string | null {
  if (!seccion) return null;
  if (seccion === 'hallazgos') return pillarsWithFindings.length > 0 ? `dim-${pillarsWithFindings[0]}` : null;
  if (seccion === 'cobertura') return 'cobertura-titulo';
  if (seccion === 'evidencia-sugerida') return 'falta-titulo';
  if (seccion.startsWith('pilar-')) {
    const dim = seccion.slice('pilar-'.length);
    return pillarsWithFindings.includes(dim) ? `dim-${dim}` : 'madurez-titulo';
  }
  return null;
}

// ── Estrategia y Tablero (AG-036, lote H4b): misma mecánica; no son rutas nuevas de la tabla ──

/** Subruta de Estrategia: `<base>/resumen` o `<base>/detalle[/<sección>]`. */
export const STRATEGY_VIEW = /^(#\/consultor\/proyectos\/[^/]+\/estrategia)\/(?:(resumen)|(detalle)(?:\/([a-z0-9-]+))?)$/;
/** Subruta del Tablero: `#/lider/resumen` o `#/lider/detalle` (sin secciones). */
export const DASHBOARD_VIEW = /^(#\/lider)\/(?:(resumen)|(detalle))$/;
/** Todas las rutas con vista; el grupo 1 es la ruta base, el 2 «resumen», el 3 «detalle» y el 4 la sección. */
export const VIEW_ROUTES: readonly RegExp[] = [DIAGNOSIS_VIEW, STRATEGY_VIEW, DASHBOARD_VIEW];

/** Identificador seguro para una sección o un id del DOM a partir de el id de un riesgo o de una fase (p. ej. «R1» → «r1»). */
export function slugId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function estrategiaHref(projectId: string, vista: Vista, seccion?: string): string {
  const base = `#/consultor/proyectos/${projectId}/estrategia/${vista}`;
  return vista === 'detalle' && seccion ? `${base}/${seccion}` : base;
}

export function tableroHref(vista: Vista): string {
  return `#/lider/${vista}`;
}

/** Id del encabezado al que lleva una sección del Detalle de Estrategia (`riesgo-<id>` y `fase-<id>` son las tarjetas). */
export function sectionTargetEstrategia(seccion: string | undefined): string | null {
  if (!seccion) return null;
  if (seccion === 'riesgos-ruta') return 'estr-riesgos';
  if (seccion === 'trazabilidad') return 'trazabilidad-titulo';
  if (/^(riesgo|fase)-[a-z0-9-]+$/.test(seccion)) return seccion;
  return null;
}
