export type AdoptionStatus = 'Pendiente' | 'En curso' | 'Completado';
export type AdoptionId = 'documentos' | 'diagnostico' | 'estrategia';

export interface AdoptionStep {
  id: AdoptionId;
  label: string;
  status: AdoptionStatus;
}

export interface AdoptionInput {
  evidenceCount: number;
  diagnosis: 'none' | 'generated' | 'issued';
  strategy: 'none' | 'generated' | 'sent';
}

/** Ruta de adopción de la Empresa en tres pasos, derivada del estado real del proyecto (FR-034). */
export function adoptionSteps(i: AdoptionInput): AdoptionStep[] {
  return [
    { id: 'documentos', label: 'Documentos', status: i.evidenceCount >= 1 ? 'Completado' : 'Pendiente' },
    { id: 'diagnostico', label: 'Diagnóstico', status: i.diagnosis === 'issued' ? 'Completado' : i.diagnosis === 'generated' ? 'En curso' : 'Pendiente' },
    { id: 'estrategia', label: 'Estrategia', status: i.strategy === 'sent' ? 'Completado' : i.strategy === 'generated' ? 'En curso' : 'Pendiente' },
  ];
}

/** Próximo paso: el del primer paso sin completar; con todo completado, la encuesta o el informe. */
export function nextStep(steps: readonly AdoptionStep[], surveyDone: boolean): string {
  const first = steps.find((s) => s.status !== 'Completado');
  if (first?.id === 'documentos') return 'Compartir los documentos de su empresa con el equipo de consultoría.';
  if (first?.id === 'diagnostico') return 'Esperar el diagnóstico: el equipo de consultoría lo está preparando y revisando.';
  if (first?.id === 'estrategia') return 'Esperar la estrategia, que se deriva del diagnóstico emitido.';
  return surveyDone ? 'Revisar el informe de diagnóstico.' : 'Responder la encuesta corta.';
}
