import { formatDateTime } from '../domain/format';
import type { TechSheetRow } from '../domain/techSheet';

const STAGE: Record<TechSheetRow['stage'], string> = { diagnosis: 'Diagnóstico', strategy: 'Estrategia', critic: 'Revisión crítica' };

/** «Ficha técnica» del informe (AG-023): solo para roles internos; la Empresa nunca la recibe. */
export function TechSheet({ rows }: { rows: readonly TechSheetRow[] }) {
  return (
    <section aria-labelledby="inf-ficha" className="tech-sheet" data-testid="tech-sheet">
      <h2 id="inf-ficha">Ficha técnica</h2>
      <ul className="list-plain">
        {rows.map((r) => (
          <li key={r.stage}>
            {STAGE[r.stage]} · modelo {r.model} · Fecha {formatDateTime(r.finishedAt)} · entrada {r.tokens.input} · salida {r.tokens.output} · total {r.tokens.total}
          </li>
        ))}
      </ul>
    </section>
  );
}
