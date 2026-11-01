import { extensionOf } from './fileValidation';

export type EvidenceKind = 'documento' | 'transcripcion' | 'entrevista';

/** txt, vtt y srt se tratan como transcripciones; pdf, docx y xlsx, como documentos. */
export function kindOfFile(name: string): 'documento' | 'transcripcion' {
  return ['txt', 'vtt', 'srt'].includes(extensionOf(name)) ? 'transcripcion' : 'documento';
}

export interface CaptureProgress {
  questionsAnswered: number;
  questionsTotal: number;
  interviews: number;
  documents: number;
  evidence: number;
  percent: number;
}

/**
 * Avance de captura: cada pregunta respondida es un paso y tener al menos un
 * elemento de evidencia es un paso más.
 */
export function captureProgress(
  questionIds: readonly string[],
  answers: Record<string, string>,
  kinds: readonly EvidenceKind[],
): CaptureProgress {
  const questionsAnswered = questionIds.filter((id) => (answers[id] ?? '').trim() !== '').length;
  const interviews = kinds.filter((k) => k === 'entrevista' || k === 'transcripcion').length;
  const documents = kinds.filter((k) => k === 'documento').length;
  const steps = questionIds.length + 1;
  const done = questionsAnswered + (kinds.length > 0 ? 1 : 0);
  return {
    questionsAnswered,
    questionsTotal: questionIds.length,
    interviews,
    documents,
    evidence: kinds.length,
    percent: Math.round((done / steps) * 100),
  };
}

/** «Generar diagnóstico» exige al menos un elemento de evidencia (FR-015). */
export function canGenerate(evidenceCount: number): boolean {
  return evidenceCount >= 1;
}

export type Stage = 'Evidencia' | 'Diagnóstico' | 'Estrategia';

export interface ProjectProgress {
  stage: Stage;
  percent: number;
  status: 'pendiente' | 'en-curso' | 'completado';
}

/** Tres fases (Evidencia, Diagnóstico emitido, Estrategia enviada) de un tercio cada una. */
export function projectProgress(p: {
  evidenceCount: number;
  diagnosis: 'none' | 'generated' | 'issued';
  strategy: 'none' | 'generated' | 'sent';
}): ProjectProgress {
  const evidenceDone = canGenerate(p.evidenceCount);
  const diagnosisDone = p.diagnosis === 'issued';
  const strategyDone = p.strategy === 'sent';
  const completed = [evidenceDone, diagnosisDone, strategyDone].filter(Boolean).length;
  const stage: Stage = !evidenceDone ? 'Evidencia' : !diagnosisDone ? 'Diagnóstico' : 'Estrategia';
  const status = completed === 3 ? 'completado' : completed === 0 && p.diagnosis === 'none' && p.strategy === 'none' ? 'pendiente' : 'en-curso';
  return { stage, percent: Math.round((completed / 3) * 100), status };
}
