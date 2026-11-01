// Lógica pura de check-names (probada en tests/unit/names.test.ts).

/** Minúsculas y sin tildes. */
export function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Una entrada por línea; se ignoran las vacías y las que empiezan con #. */
export function parseDenylist(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('#'))
    .map(normalize);
}

/** Devuelve { term, line } por cada línea que contiene un término (sin distinguir mayúsculas ni tildes). */
export function findMatches(text, terms) {
  const out = [];
  normalize(text)
    .split(/\r?\n/)
    .forEach((line, i) => {
      for (const term of terms) if (line.includes(term)) out.push({ term, line: i + 1 });
    });
  return out;
}

/** 'check' | 'fail' (local sin lista) | 'skip' (CI sin lista: avisa y omite solo esa comprobación). */
export function denylistMode({ hasList, isCI }) {
  if (hasList) return 'check';
  return isCI ? 'skip' : 'fail';
}

/** `git ls-files referencias` no vacío = referencias/ está versionada. */
export function referenciasTracked(lsFilesOutput) {
  return lsFilesOutput.trim() !== '';
}

export function findPdfFiles(paths) {
  return paths.filter((p) => p.toLowerCase().endsWith('.pdf'));
}
