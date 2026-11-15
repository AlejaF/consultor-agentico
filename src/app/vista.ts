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
