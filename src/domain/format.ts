import { extensionOf } from './fileValidation';

/** Tamaño legible con coma decimal: 1,5 KB, 25,0 MB. */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const dec = (n: number) => n.toFixed(1).replace('.', ',');
  if (bytes < 1024 * 1024) return `${dec(bytes / 1024)} KB`;
  return `${dec(bytes / (1024 * 1024))} MB`;
}

/** Palabra en singular solo con 1; en plural en cualquier otro caso (incluido 0). */
export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** «1 archivo», «4 proyectos». */
export function countOf(n: number, one: string, many: string): string {
  return `${n} ${plural(n, one, many)}`;
}

/** Tipo legible del archivo: la extensión en mayúsculas («PDF»). */
export function fileTypeLabel(name: string): string {
  const ext = extensionOf(name);
  return ext ? ext.toUpperCase() : 'Archivo';
}

/** Un decimal con coma: 2,4 · 3,0. */
export function formatDecimal(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
}

/** Puntaje de 1,0 a 5,0 con coma decimal: 4,3 · 4,0. */
export function formatScore(n: number): string {
  return formatDecimal(n);
}

/** Zona fija de la demo: todas las fechas y horas se muestran en hora de Bogotá, sea cual sea la zona del navegador. */
export const DISPLAY_TIME_ZONE = 'America/Bogota';

/** Fecha y hora cortas en español, en hora de Bogotá. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short', timeZone: DISPLAY_TIME_ZONE }).format(new Date(iso));
}
