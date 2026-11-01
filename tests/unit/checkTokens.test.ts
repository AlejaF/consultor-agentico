import { describe, expect, it } from 'vitest';
import { findColorLiterals } from '../../scripts/lib/tokens.mjs';

describe('check-tokens: colores literales', () => {
  it('un SVG con color hexadecimal falla', () => {
    expect(findColorLiterals('<svg><path fill="#ff0000"/></svg>')).toHaveLength(1);
  });
  it('rgb( y hsl( fallan', () => {
    expect(findColorLiterals('a{color:rgb(1,2,3)}')).toHaveLength(1);
    expect(findColorLiterals('a{color:hsl(1,2%,3%)}')).toHaveLength(1);
  });
  it('currentColor y var(--token) pasan', () => {
    expect(findColorLiterals('<svg><path fill="currentColor"/></svg>')).toEqual([]);
    expect(findColorLiterals('a{color:var(--color-ink)}')).toEqual([]);
  });
  it('informa el número de línea', () => {
    expect(findColorLiterals('a{}\nb{color:#fff}')).toEqual([{ line: 2, text: '#fff' }]);
  });
});
