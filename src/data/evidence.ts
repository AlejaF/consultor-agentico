import type { EvidenceKind } from '../domain/progress';

export type Slot = 1 | 2 | 3 | 4 | 5;

export interface Excerpt {
  id: string;
  slot: Slot;
  /** «min 14:20» o «pág. 12». */
  locator: string;
  text: string;
}

export interface EvidenceSlot {
  slot: Slot;
  kind: EvidenceKind;
  /** Admite {empresa}. */
  name: string;
  detail: string;
  excerpts: Excerpt[];
}

/** Evidencia de ejemplo, por ranura (1 a 5), igual en todos los proyectos. Todo es ficticio. */
export const EVIDENCE_SLOTS: readonly EvidenceSlot[] = [
  {
    slot: 1,
    kind: 'documento',
    name: 'Informe de procesos internos de {empresa}',
    detail: 'Documento de ejemplo · 24 páginas',
    excerpts: [
      { id: 'S1-E1', slot: 1, locator: 'pág. 12', text: 'Los pedidos se registran a mano en hojas de cálculo y se consolidan una vez por semana entre las áreas.' },
      { id: 'S1-E2', slot: 1, locator: 'pág. 18', text: 'No existe un responsable único de los indicadores del proceso; cada área lleva sus propias cifras.' },
    ],
  },
  {
    slot: 2,
    kind: 'transcripcion',
    name: 'Entrevista con la dirección de {empresa}',
    detail: 'Transcripción de ejemplo · 52 min',
    excerpts: [
      { id: 'S2-E1', slot: 2, locator: 'min 14:20', text: 'Queremos crecer, pero hoy nadie puede decirme con certeza cuánto cuesta atender a un cliente nuevo.' },
      { id: 'S2-E2', slot: 2, locator: 'min 31:05', text: 'Hemos probado herramientas de analítica dos veces y se abandonaron a los pocos meses.' },
    ],
  },
  {
    slot: 3,
    kind: 'entrevista',
    name: 'Entrevista con el área de operaciones de {empresa}',
    detail: 'Entrevista de ejemplo · 38 min',
    excerpts: [
      { id: 'S3-E1', slot: 3, locator: 'min 09:40', text: 'Los datos viven en tres sistemas distintos y para cruzarlos hay que pedirle el favor a una sola persona.' },
      { id: 'S3-E2', slot: 3, locator: 'min 22:10', text: 'Si esa persona se ausenta, los reportes se retrasan hasta que vuelve.' },
    ],
  },
  {
    slot: 4,
    kind: 'documento',
    name: 'Política de gestión de datos de {empresa}',
    detail: 'Documento de ejemplo · 9 páginas',
    excerpts: [
      { id: 'S4-E1', slot: 4, locator: 'pág. 3', text: 'La política establece que los datos de clientes deben protegerse, sin definir quién la hace cumplir.' },
      { id: 'S4-E2', slot: 4, locator: 'pág. 7', text: 'No hay un calendario de revisión de accesos ni un inventario actualizado de los sistemas.' },
    ],
  },
  {
    slot: 5,
    kind: 'transcripcion',
    name: 'Taller de cultura y capacidades de {empresa}',
    detail: 'Transcripción de ejemplo · 65 min',
    excerpts: [
      { id: 'S5-E1', slot: 5, locator: 'min 18:30', text: 'El equipo está dispuesto a aprender, pero no hay tiempo asignado para capacitación.' },
      { id: 'S5-E2', slot: 5, locator: 'min 44:00', text: 'Las decisiones se toman por costumbre; los datos se consultan solo cuando algo sale mal.' },
    ],
  },
];

export function resolveName(name: string, companyName: string): string {
  return name.replaceAll('{empresa}', companyName);
}
