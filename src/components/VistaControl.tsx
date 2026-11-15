import { vistaHref, type Vista } from '../app/vista';

/**
 * Control «Resumen | Detalle» (AG-036): dos enlaces con aria-current, NO un tablist. Cambia de ruta (la vista vive en el hash),
 * así que la vista se conserva al recargar y solo se monta la activa.
 */
export function VistaControl({ projectId, vista }: { projectId: string; vista: Vista }) {
  const item = (v: Vista, text: string) => (
    <a key={v} className={v === vista ? 'vista-link vista-activa' : 'vista-link'} href={vistaHref(projectId, v)} {...(v === vista ? { 'aria-current': 'page' as const } : {})}>
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
