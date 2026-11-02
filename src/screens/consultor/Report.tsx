import { ReportPage } from '../../components/ReportPage';

export function Report({ projectId }: { projectId: string }) {
  return <ReportPage projectId={projectId} scope="consultor" back={{ href: `#/consultor/proyectos/${projectId}/diagnostico`, label: '← Diagnóstico' }} />;
}
