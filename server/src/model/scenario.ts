// SOLO PARA PRUEBAS DE EXTREMO A EXTREMO (MODEL_PROVIDER=fake + FAKE_SCRIPT): un cliente FALSO que elige el guion
// según la empresa de la solicitud y vuelve a empezar el guion en cada corrida. No toca la red ni gasta nada.
import { ModelError, type ModelClient, type ModelErrorCategory, type ModelRequest, type ModelResponse } from './client.ts';
import { createFakeClient, type FakeClient, type Step } from './fake.ts';

type RawStep = Exclude<Step, { throw: ModelError }> | { throw: { category: ModelErrorCategory; message: string } };

export interface ScenarioFile {
  porDefecto: RawStep[];
  porEmpresa?: Record<string, RawStep[]>;
  /** Guion de la etapa de Estrategia (se elige cuando la solicitud declara la herramienta `registrar_elemento`). */
  estrategia?: { porDefecto: RawStep[]; porEmpresa?: Record<string, RawStep[]> };
}

const toSteps = (raw: RawStep[]): Step[] => raw.map((s) => ('throw' in s ? { throw: new ModelError(s.throw.category, s.throw.message) } : s));

function companyOf(req: ModelRequest): string {
  const first = req.input.find((i) => i.type === 'message' && i.role === 'user');
  const text = first && first.type === 'message' ? first.content : '';
  // El nombre llega delimitado y escapado: <empresa>…</empresa> (lote N); antes iba entre «».
  const tag = /<empresa>([^<]*)<\/empresa>/.exec(text)?.[1];
  if (tag !== undefined) return tag.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  return /«([^»]+)»/.exec(text)?.[1] ?? '';
}

export function createScenarioClient(file: ScenarioFile): ModelClient {
  let current: { client: FakeClient; length: number; stage: string } | null = null;
  return {
    name: 'fake',
    async respond(req, signal): Promise<ModelResponse> {
      // Una corrida nueva empieza cuando la anterior consumió todo su guion.
      const stage = req.tools.some((t) => t.name === 'registrar_elemento') ? 'strategy' : 'diagnosis';
      if (current === null || current.stage !== stage || current.client.calls >= current.length) {
        const set = stage === 'strategy' ? (file.estrategia ?? { porDefecto: [{ text: 'Sin guion de estrategia.' }] }) : file;
        const raw = set.porEmpresa?.[companyOf(req)] ?? set.porDefecto;
        current = { client: createFakeClient(toSteps(raw)), length: raw.length, stage };
      }
      return current.client.respond(req, signal);
    },
  };
}
