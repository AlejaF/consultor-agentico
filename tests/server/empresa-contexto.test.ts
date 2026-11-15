// El nombre de la empresa es CONTEXTO, no un criterio de pertenencia (lote E.1).
import { describe, expect, it } from 'vitest';
import { runDiagnosis, SYSTEM_PROMPT, buildUserMessage } from '../../server/src/agent/diagnosis.ts';
import { loadConfig } from '../../server/src/config.ts';
import { createFakeClient } from '../../server/src/model/fake.ts';

const KEY = 'sk-' + 'proj-' + 'Kk4_'.repeat(12);

describe('el nombre del proyecto no es un filtro de pertenencia', () => {
  it('el prompt de sistema trae la regla: los documentos del proyecto son de esa empresa aunque no la nombren', () => {
    expect(SYSTEM_PROMPT).toMatch(/documentos cargados en el proyecto.*(son|se consideran) de esa empresa/i);
    expect(SYSTEM_PROMPT).toMatch(/sigla|razón social|otro nombre/i);
    expect(SYSTEM_PROMPT).toMatch(/no descartes evidencia/i);
    expect(SYSTEM_PROMPT).toMatch(/información faltante.*solo.*(tras buscar|después de buscar)/i);
  });

  it('ni el prompt ni el mensaje inicial mandan excluir o filtrar por nombre', () => {
    const texto = `${SYSTEM_PROMPT}\n${buildUserMessage('Empresa Ficticia Delta')}`;
    expect(texto).not.toMatch(/identificad[oa]s? como perteneciente/i);
    expect(texto).not.toMatch(/solo (los )?(documentos|fragmentos|evidencia) (que )?(mencion|nombr|cit)/i);
    expect(texto).not.toMatch(/descarta[^.]*(no (mencion|nombr|coincid))/i);
    expect(texto).not.toMatch(/(coincida|coincidir) el nombre.*(descart|ignor|exclu)/i);
  });

  it('el mensaje inicial presenta el nombre como contexto y repite la regla', () => {
    const m = buildUserMessage('Empresa Ficticia Delta');
    expect(m).toContain('<empresa>Empresa Ficticia Delta</empresa>');
    expect(m).toMatch(/contexto/i);
    expect(m).toMatch(/aunque no (la )?nombren/i);
    expect(buildUserMessage('')).not.toContain('<empresa>');
  });

  it('lo que llega realmente al modelo lleva la regla (sistema y mensaje)', async () => {
    const client = createFakeClient([{ text: 'fin' }]);
    await runDiagnosis({ client, config: loadConfig({ MODEL_PROVIDER: 'fake', OPENAI_MODEL_DIAGNOSTICO: 'm', OPENAI_API_KEY: KEY }), files: [], empresa: 'Empresa Ficticia Delta' });
    const req = client.requests[0]!;
    expect(req.system).toBe(SYSTEM_PROMPT);
    expect(String((req.input[0] as { content: string }).content)).toBe(buildUserMessage('Empresa Ficticia Delta'));
  });
});
