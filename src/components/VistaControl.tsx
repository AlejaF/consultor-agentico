import { vistaHref, type Vista } from '../app/vista';

/**
 * Control «Resumen | Detalle» (AG-036): dos enlaces con aria-current, NO un tablist. Cambia de ruta (la vista vive en el hash),
 * así que la vista se conserva al recargar y solo se monta la activa. `href` da la dirección de cada vista (Diagnóstico por omisión).
 */
export function VistaControl({ projectId, vista, href }: { projectId?: string; vista: Vista; href?: (v: Vista) => string }) {
  const dir = (v: Vista) => (href ? href(v) : vistaHref(projectId ?? '', v));
  const item = (v: Vista, text: string) => (
    <a key={v} className={v === vista ? 'vista-link vista-activa' : 'vista-link'} href={dir(v)} {...(v === vista ? { 'aria-current': 'page' as const } : {})}>
      {text}
    </a>
  );
  return (
    <nav className="vista-control" aria-label="Vista de la pantalla">
      {item('resumen', 'Resumen')}
      {item('detalle', 'Detalle')}
    </nav>
  );
}
