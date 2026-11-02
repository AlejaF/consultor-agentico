import { ReportPage } from '../../components/ReportPage';

/** Informe de una entrega (FR-044): `dx` solo el diagnóstico; `st` la estrategia enviada con su diagnóstico. */
export function Report({ tipo, projectId }: { tipo: 'dx' | 'st'; projectId: string }) {
  return <ReportPage projectId={projectId} scope={tipo} back={{ href: `#/lider/entregas/${tipo}/${projectId}`, label: '← Revisión de la entrega' }} />;
}
