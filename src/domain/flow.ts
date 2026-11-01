export type StepStatus = 'Pendiente' | 'En curso' | 'Completado' | 'Bloqueado';
export type StepId = 'evidencia' | 'diagnostico' | 'revision' | 'estrategia';

export interface FlowInput {
  evidenceCount: number;
  hasAnswers: boolean;
  diagnosis: 'none' | 'generated' | 'issued';
  /** Hallazgos con decisión distinta de pendiente. */
  reviewed: number;
  strategy: 'none' | 'generated' | 'sent';
}

export interface FlowStep {
  id: StepId;
  label: string;
  status: StepStatus;
}

/** Los cuatro pasos del flujo de un proyecto, con su estado en texto (FR-049). */
export function flowSteps(i: FlowInput): FlowStep[] {
  const hasEvidence = i.evidenceCount >= 1;
  const issued = i.diagnosis === 'issued';

  const evidencia: StepStatus = hasEvidence ? 'Completado' : i.hasAnswers ? 'En curso' : 'Pendiente';
  const diagnostico: StepStatus = !hasEvidence && i.diagnosis === 'none' ? 'Bloqueado' : i.diagnosis === 'none' ? 'Pendiente' : issued ? 'Completado' : 'En curso';
  const revision: StepStatus = i.diagnosis === 'none' ? 'Bloqueado' : issued ? 'Completado' : i.reviewed > 0 ? 'En curso' : 'Pendiente';
  const estrategia: StepStatus = !issued ? 'Bloqueado' : i.strategy === 'sent' ? 'Completado' : i.strategy === 'generated' ? 'En curso' : 'Pendiente';

  return [
    { id: 'evidencia', label: 'Evidencia', status: evidencia },
    { id: 'diagnostico', label: 'Diagnóstico', status: diagnostico },
    { id: 'revision', label: 'Revisión', status: revision },
    { id: 'estrategia', label: 'Estrategia', status: estrategia },
  ];
}
