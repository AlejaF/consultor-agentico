import { PrintReport } from './PrintReport';
import { projectInfo } from '../domain/lookup';
import { maturityOf } from '../domain/maturity';
import { reportContent, type ReportScope } from '../domain/report';
import { useAppState } from '../state/context';

/** Pantalla del informe: bloqueo explicado, o el informe con el botón de impresión del navegador (FR-044, FR-045, FR-048). */
export function ReportPage({ projectId, scope, back }: { projectId: string; scope: ReportScope; back: { href: string; label: string } }) {
  const { state } = useAppState();
  const { company } = projectInfo(projectId);
  const ps = state.projects[projectId];
  const content = reportContent(ps.diagnosis, ps.strategy, scope, maturityOf(projectId));
  const what = scope === 'dx' ? 'Diagnóstico' : scope === 'st' ? 'Estrategia con su diagnóstico' : 'Diagnóstico y estrategia';
  return (
    <>
      <p className="no-print">
        <a className="btn" href={back.href}>
          {back.label}
        </a>
      </p>
      <h1>Informe de diagnóstico</h1>
      <p className="no-print">
        {what} · {company.name} · Proyecto {projectId}
      </p>
      {!content.available ? (
        <section className="card" aria-labelledby="informe-bloqueado">
          <h2 id="informe-bloqueado">Informe no disponible</h2>
          <p>{content.reason}</p>
        </section>
      ) : (
        <>
          <p className="subtitle no-print">
            Se imprime con la función de impresión de tu navegador (también puedes guardarlo como PDF). Solo incluye los hallazgos aceptados o
            editados; nada sale de tu navegador.
          </p>
          <p className="no-print">
            <button type="button" className="primary" onClick={() => window.print()}>
              Imprimir o guardar como PDF
            </button>
          </p>
          <PrintReport content={content} companyName={company.name} projectLabel={`Proyecto ${projectId}`} />
        </>
      )}
    </>
  );
}
