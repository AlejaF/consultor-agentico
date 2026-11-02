export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
}

export const RUBRIC_TITLE = 'Criterios de ejemplo (pendientes de definir por el profesor)';

/** Meta del programa, solo ilustrativa: no tiene efectos sobre el flujo. */
export const PROGRAM_GOAL = 4.2;

export const RUBRIC_CRITERIA: readonly RubricCriterion[] = [
  { id: 'K1', name: 'Trazabilidad de la evidencia', description: 'Cada hallazgo y cada recomendación se apoyan en evidencia que se puede citar.' },
  { id: 'K2', name: 'Calidad del análisis', description: 'El análisis es claro, completo y distingue lo verificado de lo que no lo está.' },
  { id: 'K3', name: 'Coherencia entre diagnóstico y estrategia', description: 'La estrategia se deriva de los hallazgos aceptados y verificados del diagnóstico.' },
  { id: 'K4', name: 'Claridad de la comunicación', description: 'El texto es comprensible para quien toma la decisión, sin jerga innecesaria.' },
];

export const CRITERION_IDS: readonly string[] = RUBRIC_CRITERIA.map((c) => c.id);
