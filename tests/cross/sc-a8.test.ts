// Lote D2 · T144 (SC-A8): el 100 % de los niveles con número cita al menos un hallazgo aceptado o editado y verificado,
// muestra «basado en N» correcto, y el índice coincide con un cálculo independiente por código.
import { afterEach, describe, expect, it } from 'vitest';
import { buildServer } from '../../server/src/app.ts';
import { loadConfig } from '../../server/src/config.ts';
import { createLogger } from '../../server/src/log.ts';
import { createFakeClient, type Step } from '../../server/src/model/fake.ts';
import { createStore } from '../../server/src/store.ts';
import { evaluateMaturity, maturityIndex } from '../../src/domain/maturity';
import { toRealState } from '../../src/providers/real';
import type { DiagnosisResponse } from '../../src/providers/types';
import type { Decision } from '../../src/state/types';

const KEY = 'sk-' + 'proj-' + 'Kk4_'.repeat(12);
let toClose: Array<{ close: () => Promise<unknown> }> = [];
afterEach(async () => {
  for (const s of toClose) await s.close();
  toClose = [];
});
const TEXTS = [
  'Los indicadores se calculan a mano cada mes y no hay responsable.',
  'La dirección aprobó un presupuesto anual para automatizar procesos.',
  'El equipo de talento no tiene un plan de formación en analítica.',
  'No existe un comité de gobierno de datos con reuniones periódicas.',
];
const FRAG = ['se calculan a mano cada mes', 'La dirección aprobó un presupuesto anual', 'no tiene un plan de formación', 'No existe un comité de gobierno de datos'];
const find = (pilar: string, titulo: string, i: number): Step => ({ toolCalls: [{ name: 'registrar_hallazgo', arguments: { pilar, titulo, texto: 'Texto.', citas: [{ archivo: 'notas.txt', ubicacion: `línea ${i + 1}`, fragmento: FRAG[i] }] } }] });
const lvl = (dimension: string, derivaDe: string[], nivel: number): Step => ({ toolCalls: [{ name: 'registrar_nivel_madurez', arguments: { dimension, nivel, justificacion: 'Justificación corta.', derivaDe } }] });

async function run(script: Step[]): Promise<DiagnosisResponse> {
  const store = createStore();
  store.putFile('P-A', { id: 'f1', name: 'notas.txt', type: 'text/plain', size: 10, status: 'extracted', chars: 10, chunkCount: 4 }, TEXTS.map((text, i) => ({ location: { kind: 'line' as const, n: i + 1 }, text })));
  const app = await buildServer(loadConfig({ MODEL_PROVIDER: 'fake', OPENAI_MODEL_DIAGNOSTICO: 'm', OPENAI_API_KEY: KEY }), createLogger(() => {}), store, { modelClient: createFakeClient(script) });
  toClose.push(app);
  const r = await app.inject({ method: 'POST', url: '/api/diagnosis/run', headers: { host: '127.0.0.1:8787' }, payload: { projectId: 'P-A' } });
  expect(r.statusCode).toBe(200);
  return r.json() as DiagnosisResponse;
}

const SCENARIOS: Array<[string, Step[]]> = [
  ['cuatro dimensiones con respaldo', [find('datos', 'A', 0), find('estrategia', 'B', 1), find('talento', 'C', 2), find('gobernanza', 'D', 3), lvl('datos', ['R1'], 2), lvl('estrategia', ['R2'], 4), lvl('talento', ['R3'], 1), lvl('gobernanza', ['R4'], 5), { text: 'Fin.' }]],
  ['dos dimensiones y el resto sin evidencia', [find('datos', 'A', 0), find('estrategia', 'B', 1), lvl('datos', ['R1'], 3), lvl('estrategia', ['R2'], 3), { text: 'Fin.' }]],
  ['un modelo que intenta citar hallazgos de otro pilar o inexistentes', [find('datos', 'A', 0), lvl('talento', ['R1'], 5), lvl('talento', ['R9'], 5), lvl('talento', ['R1'], 5), lvl('datos', ['R1'], 2), { text: 'Fin.' }]],
  ['sin ningún nivel', [find('datos', 'A', 0), { text: 'Fin.' }]],
];
const DECISION_SETS: Array<Record<string, Decision['state']>> = [
  {}, { R1: 'accepted' }, { R1: 'accepted', R2: 'edited', R3: 'accepted', R4: 'accepted' }, { R1: 'rejected', R2: 'accepted' }, { R1: 'pending', R2: 'rejected', R3: 'rejected', R4: 'rejected' },
];
const toDecisions = (o: Record<string, Decision['state']>): Record<string, Decision> => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === 'edited' ? { state: 'edited', text: 'x' } : { state: v }])) as Record<string, Decision>;

describe('SC-A8', () => {
  it.each(SCENARIOS)('%s: todo nivel con número tiene respaldo vigente, «basado en N» correcto e índice igual al cálculo independiente', async (_name, script) => {
    const real = toRealState(await run(script), 'a', 'b');
    expect(real.maturity).toHaveLength(6);
    for (const set of DECISION_SETS) {
      const decisions = toDecisions(set);
      const ev = evaluateMaturity(real.maturity, real.findings, decisions);
      // cálculo independiente (no reutiliza backedFindings)
      const expected: number[] = [];
      for (const level of real.maturity!) {
        const view = ev.levels.find((l) => l.dimension === level.dimension)!;
        const backing = level.derivesFrom.filter((id) => {
          const f = real.findings.find((x) => x.id === id);
          const st = decisions[id]?.state;
          return !!f && f.verified && (st === 'accepted' || st === 'edited');
        });
        if (level.level !== null && !level.insufficient && backing.length > 0) {
          expect(view.status).toBe('backed');
          expect(view.basedOn).toBe(backing.length);
          expect((view as { level?: number }).level).toBe(level.level);
          expected.push(level.level);
        } else {
          expect(view.status).not.toBe('backed'); // ningún nivel se muestra con número sin respaldo vigente
          expect((view as { level?: number }).level).toBeUndefined();
        }
      }
      const mean = expected.length === 0 ? null : expected.reduce((a, b) => a + b, 0) / expected.length;
      expect(ev.index).toBe(mean);
      expect(maturityIndex(real.maturity, real.findings, decisions)).toBe(mean);
    }
  });
  it('el navegador no confía solo en el servicio: un nivel que cita un hallazgo NO verificado o inexistente llega como «sin evidencia»', () => {
    const resp: DiagnosisResponse = {
      run: { stage: 'diagnosis', model: 'm', reasoning: null, iterations: 1, partial: false, tokens: { input: 1, output: 1, total: 2 } },
      findings: [{ id: 'R1', dimension: 'datos', title: 't', text: 't', verified: false, unverifiedReason: 'x', citations: [] }],
      missingInfo: [], trace: [], warnings: [],
      maturity: [
        { dimension: 'datos', level: 4, insufficient: false, justification: 'x', derivesFrom: ['R1'] },
        { dimension: 'cultura', level: 4, insufficient: false, justification: 'x', derivesFrom: ['R7'] },
        { dimension: 'talento', level: 9, insufficient: false, justification: 'x', derivesFrom: ['R1'] },
      ],
    };
    const real = toRealState(resp, 'a', 'b');
    expect(real.maturity).toHaveLength(6);
    expect(real.maturity!.every((l) => l.level === null && l.insufficient)).toBe(true);
  });
});
