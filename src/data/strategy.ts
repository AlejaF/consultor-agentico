export interface StrategyItem {
  id: string;
  label: string;
  detail: string;
  level?: 'alto' | 'medio' | 'bajo';
  horizon?: string;
  /** Ids de hallazgos de la plantilla de diagnóstico. */
  supportedBy: string[];
}

export interface StrategyTemplate {
  risks: StrategyItem[];
  route: StrategyItem[];
  sectorAnalysis: string;
  marketAnalysis: string;
}

/** UNA plantilla de estrategia, compartida por todos los proyectos. Todo es ficticio e ilustrativo. */
export const STRATEGY: StrategyTemplate = {
  risks: [
    {
      id: 'R1',
      label: 'Decisiones de crecimiento sin el dato del costo de atención',
      detail: 'Sin conocer cuánto cuesta atender a un cliente nuevo, el crecimiento puede restar margen sin que nadie lo note.',
      level: 'alto',
      supportedBy: ['H2', 'H1'],
    },
    {
      id: 'R2',
      label: 'Errores y faltantes que se detectan tarde',
      detail: 'El registro manual de pedidos y los datos repartidos hacen que los problemas aparezcan días después de ocurrir.',
      level: 'medio',
      supportedBy: ['H4', 'H5'],
    },
    {
      id: 'R3',
      label: 'Reportes detenidos si falta una persona',
      detail: 'El conocimiento para cruzar los datos está concentrado en una sola persona y en sistemas que no se comunican.',
      level: 'alto',
      supportedBy: ['H7', 'H3'],
    },
    {
      id: 'R4',
      label: 'Protección de datos sin responsables',
      detail: 'Una política que nadie hace cumplir deja los accesos sin revisar y expone a la empresa a incidentes evitables.',
      level: 'medio',
      supportedBy: ['H6'],
    },
  ],
  route: [
    {
      id: 'F1',
      label: 'Acordar indicadores comunes y nombrar responsables',
      detail: 'Definir una versión única de las cifras clave y quién responde por ellas y por la política de datos.',
      horizon: '0 a 2 meses',
      supportedBy: ['H1', 'H6'],
    },
    {
      id: 'F2',
      label: 'Medir el costo de atender a un cliente nuevo',
      detail: 'Estimar ese costo con los datos disponibles para sustentar las decisiones de crecimiento.',
      horizon: '1 a 3 meses',
      supportedBy: ['H2'],
    },
    {
      id: 'F3',
      label: 'Conectar los sistemas y automatizar el registro de pedidos',
      detail: 'Integrar los tres sistemas y reemplazar las hojas de cálculo manuales por un registro único.',
      horizon: '3 a 6 meses',
      supportedBy: ['H3', 'H4'],
    },
    {
      id: 'F4',
      label: 'Repartir el conocimiento de los reportes y crear el hábito de usar datos',
      detail: 'Documentar el proceso de reportes, capacitar a más personas y revisar las decisiones con datos.',
      horizon: '4 a 9 meses',
      supportedBy: ['H7', 'H8'],
    },
  ],
  sectorAnalysis: 'Las empresas de tamaño similar suelen avanzar primero en indicadores comunes y después en integración de sistemas. Contenido ilustrativo, sin fuentes.',
  marketAnalysis: 'La demanda de servicios apoyados en datos crece de forma sostenida y los clientes esperan respuestas más rápidas. Contenido ilustrativo, sin fuentes.',
};
