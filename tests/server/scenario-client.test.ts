import { describe, expect, it } from 'vitest';
import { createScenarioClient } from '../../server/src/model/scenario.ts';
import type { ModelRequest } from '../../server/src/model/client.ts';

const req = (empresa: string): ModelRequest => ({
  model: 'm',
  system: 's',
  input: [{ type: 'message', role: 'user', content: `Analiza la evidencia de la empresa «${empresa}»: busca.` }],
  tools: [{ name: 't', description: 't', parameters: {} }],
  maxOutputTokens: 10,
});

describe('cliente de guiones para pruebas e2e', () => {
  const c = createScenarioClient({
    porDefecto: [{ text: 'por defecto' }],
    porEmpresa: { 'Empresa A': [{ toolCalls: [{ name: 't', arguments: {} }] }, { text: 'a' }], 'Empresa B': [{ throw: { category: 'balance', message: 'sin saldo' } }] },
  });
  it('elige el guion por empresa y vuelve a empezar en cada corrida', async () => {
    for (let vuelta = 0; vuelta < 2; vuelta++) {
      expect((await c.respond(req('Empresa A'))).toolCalls).toHaveLength(1);
      expect((await c.respond(req('Empresa A'))).text).toBe('a');
    }
  });
  it('una empresa sin guion usa el de por defecto; un error del guion llega como ModelError', async () => {
    expect((await c.respond(req('Otra'))).text).toBe('por defecto');
    await expect(c.respond(req('Empresa B'))).rejects.toMatchObject({ category: 'balance', message: 'sin saldo' });
  });
});
