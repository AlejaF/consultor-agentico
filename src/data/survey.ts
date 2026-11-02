/** Encuesta simulada de la Empresa: 3 preguntas obligatorias, escala de 1 a 5 (FR-036). Todo es ficticio. */
export interface SurveyQuestion {
  id: string;
  text: string;
}

export const SURVEY_QUESTIONS: readonly SurveyQuestion[] = [
  { id: 'q1', text: '¿Qué tan claro le resultó el diagnóstico de su empresa?' },
  { id: 'q2', text: '¿Qué tan útil le parece la forma en que se explican los hallazgos?' },
  { id: 'q3', text: '¿Qué tan probable es que comparta el informe con su equipo directivo?' },
];

/** Actividad reciente de ejemplo (ficticia, fija): no sale del estado del proyecto. */
export const SAMPLE_ACTIVITY: readonly { at: string; text: string }[] = [
  { at: '2026-10-20T14:00:00.000Z', text: 'El equipo de consultoría revisó el diagnóstico de su empresa.' },
  { at: '2026-10-14T15:30:00.000Z', text: 'Se recibieron los documentos que compartió su empresa.' },
  { at: '2026-10-08T13:30:00.000Z', text: 'Se programó la primera conversación con la dirección.' },
];

export const COMPANY_PROJECT_ID = 'P-B';
