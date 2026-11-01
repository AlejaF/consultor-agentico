export interface CaptureQuestion {
  id: string;
  label: string;
  kind: 'select' | 'text';
  options?: string[];
}

/** Preguntas de diagnóstico de la captura (ejemplo). */
export const CAPTURE_QUESTIONS: readonly CaptureQuestion[] = [
  {
    id: 'q-objetivo',
    label: '¿Cuál es el objetivo principal de la transformación?',
    kind: 'select',
    options: ['Reducir costos', 'Crecer en ventas', 'Mejorar la calidad del servicio', 'Cumplir con normativa'],
  },
  {
    id: 'q-equipo',
    label: '¿Cuántas personas trabajan en tecnología o datos?',
    kind: 'select',
    options: ['Ninguna', '1 a 3 personas', '4 a 10 personas', 'Más de 10 personas'],
  },
  { id: 'q-herramientas', label: '¿Qué herramientas usan hoy para gestionar la información?', kind: 'text' },
  { id: 'q-dolor', label: '¿Cuál es el problema que más tiempo les quita?', kind: 'text' },
  {
    id: 'q-plazo',
    label: '¿En qué plazo esperan ver resultados?',
    kind: 'select',
    options: ['Menos de 3 meses', '3 a 6 meses', '6 a 12 meses', 'Más de 12 meses'],
  },
];
