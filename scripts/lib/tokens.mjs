// Lógica pura de check-tokens (probada en tests/unit/checkTokens.test.ts).

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;

/** Colores literales (hexadecimal, rgb( o hsl() con su número de línea. */
export function findColorLiterals(text) {
  const out = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(COLOR_RE)) out.push({ line: i + 1, text: m[0] });
  });
  return out;
}
