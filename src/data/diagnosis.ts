import type { RealCitation } from '../state/types';
import type { Slot } from './evidence';

export type Dimension = 'estrategia' | 'infraestructura' | 'datos' | 'gobernanza' | 'talento' | 'cultura';

export const DIMENSIONS: readonly { id: Dimension; label: string }[] = [
  { id: 'estrategia', label: 'Estrategia' },
  { id: 'infraestructura', label: 'Infraestructura' },
  { id: 'datos', label: 'Datos' },
  { id: 'gobernanza', label: 'Gobernanza' },
  { id: 'talento', label: 'Talento' },
  { id: 'cultura', label: 'Cultura' },
];

export interface Citation {
  slot: Slot;
  excerptId: string;
}

export interface Finding {
  id: string;
  dimension: Dimension;
  title: string;
  /** Admite {empresa}. */
  text: string;
  citations: Citation[];
  verified: boolean;
  unverifiedReason?: string;
  /** Solo hallazgos reales (002): citas con archivo, ubicación y fragmento; `citations` queda vacío. */
  realCitations?: RealCitation[];
}

export interface DiagnosisTemplate {
  maturityIndex: number;
  findings: Finding[];
}

/** UNA plantilla de diagnóstico, compartida por todos los proyectos. Todo es ficticio. */
export const DIAGNOSIS: DiagnosisTemplate = {
  maturityIndex: 2.4,
  findings: [
    {
      id: 'H1',
      dimension: 'estrategia',
      title: 'Sin indicadores compartidos del proceso',
      text: 'En {empresa} cada área lleva sus propias cifras y no hay un responsable único de los indicadores, por lo que no existe una versión común del desempeño.',
      citations: [{ slot: 1, excerptId: 'S1-E2' }, { slot: 1, excerptId: 'S1-E1' }],
      verified: true,
    },
    {
      id: 'H2',
      dimension: 'estrategia',
      title: 'Se desconoce el costo de atender a un cliente nuevo',
      text: 'La dirección de {empresa} quiere crecer, pero no puede estimar cuánto cuesta atender a un cliente nuevo; las decisiones de crecimiento se toman sin ese dato.',
      citations: [{ slot: 2, excerptId: 'S2-E1' }],
      verified: true,
    },
    {
      id: 'H3',
      dimension: 'infraestructura',
      title: 'Datos repartidos en tres sistemas sin integración',
      text: 'La información operativa vive en tres sistemas distintos que no se comunican; cruzarla exige un trabajo manual.',
      citations: [{ slot: 3, excerptId: 'S3-E1' }, { slot: 3, excerptId: 'S3-E2' }],
      verified: true,
    },
    {
      id: 'H4',
      dimension: 'datos',
      title: 'Pedidos registrados a mano en hojas de cálculo',
      text: 'Los pedidos se anotan manualmente y se consolidan una vez por semana, lo que retrasa la detección de errores y de faltantes.',
      citations: [{ slot: 1, excerptId: 'S1-E1' }],
      verified: true,
    },
    {
      id: 'H5',
      dimension: 'datos',
      title: 'Posibles datos duplicados entre sistemas',
      text: 'Es probable que existan registros duplicados entre los sistemas, pero hoy nadie mide su volumen.',
      citations: [{ slot: 3, excerptId: 'S3-E1' }],
      verified: false,
      unverifiedReason: 'Respaldo insuficiente: solo hay una mención indirecta en una entrevista y ningún documento que lo confirme.',
    },
    {
      id: 'H6',
      dimension: 'gobernanza',
      title: 'Política de datos sin responsables ni calendario',
      text: 'La política de {empresa} declara que los datos deben protegerse, pero no define quién la hace cumplir ni cuándo se revisan los accesos.',
      citations: [{ slot: 4, excerptId: 'S4-E1' }, { slot: 4, excerptId: 'S4-E2' }],
      verified: true,
    },
    {
      id: 'H7',
      dimension: 'talento',
      title: 'Dependencia de una sola persona para los reportes',
      text: 'Los reportes dependen de una persona que cruza los datos; si se ausenta, los reportes se retrasan hasta que vuelve.',
      citations: [{ slot: 3, excerptId: 'S3-E2' }],
      verified: true,
    },
    {
      id: 'H8',
      dimension: 'cultura',
      title: 'Decisiones por costumbre, no por datos',
      text: 'En {empresa} las decisiones se toman por costumbre y los datos se consultan solo cuando algo sale mal; además, las herramientas de analítica que han probado se abandonaron a los pocos meses.',
      citations: [{ slot: 5, excerptId: 'S5-E2' }, { slot: 2, excerptId: 'S2-E2' }],
      verified: true,
    },
  ],
};

export const FINDING_IDS: readonly string[] = DIAGNOSIS.findings.map((f) => f.id);
