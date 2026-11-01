import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');

function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  if (!m) throw new Error(`Falta el token --${name} en tokens.css`);
  return m[1];
}

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [primer token, segundo token, umbral]; 4,5 = texto, 3 = gráfico/componente
const pairs: [string, string, number][] = [
  ['color-ink', 'color-surface', 4.5],
  ['color-ink', 'color-bg', 4.5],
  ['color-text', 'color-surface', 4.5],
  ['color-text', 'color-bg', 4.5],
  ['color-text-muted', 'color-surface', 4.5],
  ['color-text-muted', 'color-bg', 4.5],
  ['color-text-muted', 'color-primary-soft', 4.5],
  ['color-placeholder', 'color-surface', 4.5],
  ['color-on-primary', 'color-primary', 4.5],
  ['color-primary', 'color-surface', 4.5],
  ['color-primary', 'color-bg', 4.5],
  ['color-on-primary', 'color-primary-strong', 4.5],
  ['color-primary', 'color-primary-soft', 4.5],
  ['color-primary', 'color-track', 4.5],
  ['color-warn-text', 'color-warn-bg', 4.5],
  ['color-warn-text', 'color-surface', 4.5],
  ['color-ok-text', 'color-ok-bg', 4.5],
  ['color-ok-text', 'color-bg', 4.5],
  ['color-danger-text', 'color-danger-bg', 4.5],
  ['color-danger-text', 'color-surface', 4.5],
  ['color-pending-text', 'color-pending-bg', 4.5],
  ['color-ink', 'color-chip-yellow', 4.5],
  ['color-ink', 'color-chip-green', 4.5],
  ['color-ink', 'color-chip-orange', 4.5],
  ['color-focus', 'color-surface', 3],
  ['color-focus-on-primary', 'color-primary', 3],
  ['color-border', 'color-surface', 3],
  ['color-border', 'color-bg', 3],
  ['color-border', 'color-surface-muted', 3],
  ['color-bar-low', 'color-track', 3],
];

describe('contraste de los tokens (contracts/design-tokens.md)', () => {
  it.each(pairs)('%s sobre %s ≥ %s:1', (a, b, min) => {
    expect(ratio(token(a), token(b))).toBeGreaterThanOrEqual(min);
  });

  it('define los tokens de tipografía, espaciado y objetivos táctiles', () => {
    for (const name of ['font-sans', 'target-min', 'gutter', 'radius', 'radius-sm', 'line-height']) {
      expect(css).toMatch(new RegExp(`--${name}:`));
    }
    expect(css).toMatch(/--target-min:\s*44px/);
  });
});
