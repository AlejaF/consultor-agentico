// Modo Simulado: envuelve la plantilla de la 001 SIN cambiarla (AG-003, SC-A5).
import { DIAGNOSIS, FINDING_IDS, type Finding } from '../data/diagnosis';

export interface DiagnosisView {
  mode: 'simulated' | 'real';
  findings: readonly Finding[];
  ids: readonly string[];
}

/** Exactamente `DIAGNOSIS.findings` y `FINDING_IDS` de la 001. */
export function simulatedDiagnosis(): DiagnosisView {
  return { mode: 'simulated', findings: DIAGNOSIS.findings, ids: FINDING_IDS };
}
