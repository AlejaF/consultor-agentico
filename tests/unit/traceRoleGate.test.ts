// Lote E (AG-009, AG-023): los componentes de la traza y de los avisos se niegan a dibujarse para la Empresa o sin rol,
// aunque alguna pantalla los incluyera por error (segunda capa de defensa).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Role } from '../../src/app/router';

let role: Role | null = null;
vi.mock('../../src/state/context', () => ({ useAppState: () => ({ state: { session: { role } } }) }));
const { TraceView, RunNotices } = await import('../../src/components/TraceView');

const run = { steps: [], model: 'modelo-secreto-xyz', partial: true, errors: [{ category: 'timeout', message: 'Tardó demasiado.' }], tokens: { input: 1, output: 1, total: 2 } };
const html = () => renderToStaticMarkup(createElement('div', null, createElement(TraceView, { run }), createElement(RunNotices, { run })));

describe('la traza y los avisos técnicos según el rol', () => {
  beforeEach(() => {
    role = null;
  });
  for (const r of ['consultor', 'lider'] as const) {
    it(`${r}: ve la traza plegada con el modelo y los avisos fuera de ella`, () => {
      role = r;
      const h = html();
      expect(h).toContain('Ver cómo trabajó el agente');
      expect(h).toContain('modelo-secreto-xyz');
      expect(h).not.toMatch(/<details[^>]* open/);
      expect(h).toContain('data-testid="partial-notice"');
      expect(h).toContain('data-testid="review-warning"');
    });
  }
  for (const r of ['contacto', null] as const) {
    it(`${r ?? 'sin rol'}: no hay nada en el DOM`, () => {
      role = r;
      expect(html()).toBe('<div></div>');
    });
  }
});
