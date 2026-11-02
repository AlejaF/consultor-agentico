/** Aviso tras emitir: el Líder solo califica; no aprueba ni bloquea (historia 4, FR-022). */
export function IssuedNotice({ projectId }: { projectId: string }) {
  return (
    <>
      <p className="subtitle">En la cola del Líder. Su calificación aparecerá aquí cuando la guarde. No bloquea tu trabajo: puedes continuar con la estrategia.</p>
      <p>
        <a className="btn primary" href={`#/consultor/proyectos/${projectId}/estrategia`}>
          Continuar con la Estrategia →
        </a>
      </p>
    </>
  );
}
