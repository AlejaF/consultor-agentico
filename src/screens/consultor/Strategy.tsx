import { projectInfo } from '../../domain/lookup';
import { useAppState } from '../../state/context';

/** Provisional (L3): muestra el bloqueo explicado (FR-023). La generación de la estrategia se construye en L4. */
export function Strategy({ projectId }: { projectId: string }) {
  const { state } = useAppState();
  const { company } = projectInfo(projectId);
  const issued = state.projects[projectId].diagnosis.status === 'issued';
  return (
    <>
      <h1>Estrategia</h1>
      <p>
        {company.name} · Proyecto {projectId}
      </p>
      <section className="card" aria-labelledby="estrategia-estado">
        {issued ? (
          <>
            <h2 id="estrategia-estado">Diagnóstico emitido</h2>
            <p>La generación de la estrategia todavía no está construida en esta versión de trabajo; llega en el siguiente lote.</p>
          </>
        ) : (
          <>
            <h2 id="estrategia-estado">Estrategia bloqueada</h2>
            <p>La estrategia se deriva de un diagnóstico emitido. Emite primero el diagnóstico de este proyecto.</p>
            <p>
              <a className="btn primary" href={`#/consultor/proyectos/${projectId}/revision`}>
                Ir a la revisión
              </a>
            </p>
          </>
        )}
      </section>
    </>
  );
}
