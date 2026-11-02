import { ReportPage } from '../../components/ReportPage';
import { COMPANY_PROJECT_ID } from '../../data/survey';

/** Informe de diagnóstico de la propia empresa, en solo lectura (FR-035). Sin parámetros: solo ve P-B. */
export function Report() {
  return <ReportPage projectId={COMPANY_PROJECT_ID} scope="dx" back={{ href: '#/contacto', label: '← Inicio de la Empresa' }} />;
}
