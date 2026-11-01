/** Tamaño legible con coma decimal: 1,5 KB, 25,0 MB. */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const dec = (n: number) => n.toFixed(1).replace('.', ',');
  if (bytes < 1024 * 1024) return `${dec(bytes / 1024)} KB`;
  return `${dec(bytes / (1024 * 1024))} MB`;
}
