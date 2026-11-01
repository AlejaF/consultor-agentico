import { COMPANIES } from '../../data/companies';

/** Provisional (L1): el Contacto ve siempre el proyecto de su empresa ficticia (P-B). El resumen real es de P3. */
export function Summary() {
  const company = COMPANIES.find((c) => c.id === 'C-B');
  return (
    <>
      <h1>Resumen del proyecto</h1>
      <div className="card">
        <h2>{company?.name}</h2>
        <p>
          {company?.sector} · {company?.size}
        </p>
      </div>
    </>
  );
}
