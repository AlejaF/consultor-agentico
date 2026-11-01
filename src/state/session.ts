/**
 * Archivos agregados en esta carga de la página. El contenido nunca se conserva, pero
 * solo los que vienen del almacenamiento (tras recargar) llevan la nota «Contenido no conservado».
 */
export const addedThisSession = new Set<string>();

let counter = 0;
export function newFileId(): string {
  counter += 1;
  return `f-${Date.now().toString(36)}-${counter}`;
}
