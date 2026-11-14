// Lote D3 · T159 (AG-023, enmienda 2.1.0): el rótulo de IA no lleva el nombre del modelo.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AiBadge, aiBadgeText } from '../../src/components/AiBadge';

describe('rótulo de IA sin modelo (AG-023)', () => {
  it('aiBadgeText() devuelve exactamente «Generado por IA · requiere revisión humana»', () => {
    expect(aiBadgeText()).toBe('Generado por IA · requiere revisión humana');
  });
  it('AiBadge no recibe ningún modelo: lo pasen o no, el modelo no aparece en el texto', () => {
    const html = renderToStaticMarkup(createElement(AiBadge as never, { model: 'gpt-secreto-123' } as never));
    expect(html).toContain('Generado por IA · requiere revisión humana');
    expect(html).not.toContain('gpt-secreto-123');
    expect(html).not.toMatch(/modelo/i);
    expect(html).toContain('data-testid="ai-badge"');
  });
  it('sin propiedades produce el mismo rótulo', () => {
    expect(renderToStaticMarkup(createElement(AiBadge))).toContain('>Generado por IA · requiere revisión humana<');
  });
});
