import type { Company } from '../data/companies';

/** Tarjeta de solo lectura con datos ficticios de la empresa (FR-056). */
export function CompanyData({ company }: { company: Company }) {
  return (
    <section className="card" aria-labelledby="datos-empresa">
      <h2 id="datos-empresa">Datos de la empresa (ficticios)</h2>
      <dl className="facts">
        <div><dt>Nombre</dt><dd>{company.name}</dd></div>
        <div><dt>Sector</dt><dd>{company.sector}</dd></div>
        <div><dt>Tamaño</dt><dd>{company.size}</dd></div>
        <div><dt>Ciudad</dt><dd>{company.city}</dd></div>
        <div><dt>Sitio web</dt><dd>{company.website}</dd></div>
      </dl>
    </section>
  );
}
