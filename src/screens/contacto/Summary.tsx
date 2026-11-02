/** Mientras la vista de la Empresa no exista, la demo lo dice con claridad (FR-049, historia 7). */
export function Summary() {
  return (
    <>
      <h1>Empresa</h1>
      <section className="card" aria-labelledby="contacto-aviso">
        <h2 id="contacto-aviso">Vista no disponible</h2>
        <p>Esta vista es para la persona de la empresa cliente que recibe el informe. Aún no está disponible en esta demostración.</p>
      </section>
    </>
  );
}
