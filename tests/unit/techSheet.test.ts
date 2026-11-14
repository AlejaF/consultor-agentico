// Lote D3 · T161 (AG-025, AG-023): la ficha técnica sale del resumen guardado de la corrida.
import { describe, expect, it } from 'vitest';
import { buildTechSheet } from '../../src/domain/techSheet';
import type { RealState } from '../../src/state/types';

const real = (): RealState => ({
  findings: [],
  missingInfo: [{ dimension: 'talento', description: 'TEXTO-DE-DOCUMENTO-SECRETO' }],
  objections: [],
  diagnosisRun: {
    stage: 'diagnosis', model: 'modelo-x', iterations: 3, partial: false, tokens: { input: 600, output: 120, total: 720 }, errors: [],
    startedAt: '2026-11-14T10:00:00.000Z', finishedAt: '2026-11-14T10:01:00.000Z', toolCounts: {}, verificationFailures: 0,
    steps: [{ type: 'tool', name: 'buscar_en_evidencia', args: { consulta: 'CONSULTA-SECRETA' }, resultSummary: 'RESUMEN-SECRETO' }] as never,
  },
});

describe('ficha técnica', () => {
  it('lleva modelo, fecha y tokens de cada corrida', () => {
    const rows = buildTechSheet(real())!;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ stage: 'diagnosis', model: 'modelo-x', finishedAt: '2026-11-14T10:01:00.000Z', tokens: { input: 600, output: 120, total: 720 } });
  });
  it('no existe para un proyecto Simulado (sin estado real) ni sin corrida', () => {
    expect(buildTechSheet(undefined)).toBeNull();
    const r = real();
    delete r.diagnosisRun;
    expect(buildTechSheet(r)).toBeNull();
  });
  it('no incluye texto de documentos ni de la traza', () => {
    const json = JSON.stringify(buildTechSheet(real()));
    for (const s of ['SECRETO', 'CONSULTA', 'RESUMEN']) expect(json).not.toContain(s);
  });
});
