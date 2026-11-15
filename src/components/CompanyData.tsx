import type { Company } from '../data/companies';

/** Tarjeta de solo lectura con datos ficticios de la empresa (FR-056). */
export function CompanyData({ company, created = false }: { company: Company; created?: boolean }) {
  return (
    <section className="card" aria-labelledby="datos-empresa">
      <h2 id="datos-empresa">{created ? 'Datos de la empresa' : 'Datos de la empresa (ficticios)'}</h2>
      <dl className="facts">
        <div><dt>Nombre</dt><dd>{company.name}</dd></div>
        <div><dt>Sector</dt><dd>{company.sector}</dd></div>
        {!created && <div><dt>Tamaño</dt><dd>{company.size}</dd></div>}
        {!created && <div><dt>Ciudad</dt><dd>{company.city}</dd></div>}
        {!created && <div><dt>Sitio web</dt><dd>{company.website}</dd></div>}
      </dl>
    </section>
  );
}
