// El nombre de la empresa es un DATO (AG-032 punto 7): llega del navegador y puede ser cualquier texto. Se limpia, se topa, se escapa
// y se delimita con <empresa>, igual que el contenido de los documentos: nunca se interpreta como una instrucción.
export const MAX_EMPRESA = 80;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// eslint-disable-next-line no-control-regex
export const cleanEmpresa = (s: string) => s.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, ' ').trim().slice(0, MAX_EMPRESA).trim();

/** `<empresa>…</empresa>` con el nombre limpio y escapado, o '' si no hay nombre. */
export function renderEmpresa(raw: string | undefined): string {
  const name = raw ? cleanEmpresa(raw) : '';
  return name ? `<empresa>${esc(name)}</empresa>` : '';
}
