// Componentes de gráfico (AG-035, lote H3): SVG/CSS propios, sin librerías. Solo reciben datos YA calculados (src/domain/charts.ts).
// Cada gráfico: título que dice la pregunta, valor en texto, «Ver como tabla», tooltip con foco de teclado y objetivos de 24 px o más.
import { useId, type ReactNode } from 'react';
import type { Coverage, MaturityBar, Part, Provenance } from '../../domain/charts';

export interface TableData {
  caption: string;
  head: string[];
  rows: (string | number)[][];
}

/** Marco común: pregunta, valor en texto, gráfico y tabla equivalente plegada (abierta al imprimir). */
export function ChartFrame({ title, summary, table, children, testId, className = '' }: { title: string; summary: ReactNode; table: TableData; children: ReactNode; testId: string; className?: string }) {
  const id = useId();
  return (
    <section className={`card chart ${className}`.trim()} aria-labelledby={`${id}-t`} data-testid={testId}>
      <h2 id={`${id}-t`} className="chart-title">
        {title}
      </h2>
      <p className="chart-summary">{summary}</p>
      {children}
      <details className="chart-table">
        <summary>Ver como tabla</summary>
        <table className="rtable">
          <caption className="visually-hidden">{table.caption}</caption>
          <thead>
            <tr>
              {table.head.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

/** Barra segmentada con leyenda y cifras. El tono de cada parte lo da `tone` (estado) o es el de acento (magnitud). */
export function SegmentedBar({ parts, total, name, tones, note }: { parts: Part[]; total: number; name: string; tones?: Record<string, string>; note?: ReactNode }) {
  const label = `${name}: ${parts.filter((p) => p.n > 0).map((p) => `${p.label} ${p.n}`).join(', ') || 'sin datos'}`;
  return (
    <div className="segbar">
      <div className="segbar-track" role="img" aria-label={label}>
        {total === 0 && <span className="segbar-empty" />}
        {parts.map((p, i) =>
          p.n > 0 ? (
            <span key={p.key} className={`segbar-part tone-${tones?.[p.key] ?? `m${(i % 3) + 1}`}`} style={{ width: `${(p.n / total) * 100}%` }} data-tip={`${p.label}: ${p.n} (${p.percent} %)`} tabIndex={0} />
          ) : null,
        )}
      </div>
      <ul className="segbar-legend list-plain">
        {parts.map((p, i) => (
          <li key={p.key}>
            <span className={`swatch tone-${tones?.[p.key] ?? `m${(i % 3) + 1}`}`} aria-hidden="true" />
            <span>{p.label}</span> <strong>{p.n}</strong>
            {total > 0 && <span className="scale-based"> · {p.percent} %</span>}
          </li>
        ))}
        {note}
      </ul>
    </div>
  );
}

/** Barras ordenadas con énfasis: reales en el acento, simulados en gris con rótulo «ilustrativo». Escala fija 1 a 5. */
export function RankedBars({ bars, name }: { bars: MaturityBar[]; name: string }) {
  return (
    <ul className="ranked list-plain" aria-label={name}>
      {bars.map((b) => (
        <li key={b.id} className={b.illustrative ? 'ranked-row illustrative' : 'ranked-row'}>
          <span className="ranked-name">
            {b.name}
            {b.illustrative && <span className="badge badge-sim ranked-note">ilustrativo</span>}
          </span>
          <span className="ranked-track" data-tip={`${b.name}: ${String(b.value.toFixed(1)).replace('.', ',')} de 5${b.illustrative ? ' (ilustrativo)' : ' (estimado por IA)'}`} tabIndex={0} role="img" aria-label={`${b.name}: ${String(b.value.toFixed(1)).replace('.', ',')} de 5${b.illustrative ? ', ilustrativo' : ', estimado por IA'}`}>
            <span className="ranked-fill" style={{ width: `${b.percent}%` }} />
          </span>
          <span className="ranked-value">
            {String(b.value.toFixed(1)).replace('.', ',')}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Medidor contra un tope. Sin tope conocido NO dibuja relleno ni porcentaje (honestidad): solo el texto. */
export function Meter({ value, max, percent, label }: { value: number; max: number | null; percent: number | null; label: string }) {
  return (
    <div className="meter">
      <div
        className="meter-track"
        {...(max !== null && percent !== null ? { role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': value, 'aria-label': label } : { role: 'img', 'aria-label': `${label}: tope no disponible` })}
        data-tip={max === null ? `${label}: ${value} (tope no disponible)` : `${label}: ${value} de ${max}`}
        tabIndex={0}
      >
        {percent !== null && <span className="meter-fill" style={{ width: `${percent}%` }} />}
      </div>
      <p className="meter-text">{max === null ? `${value} (tope no disponible)` : `${value} de ${max}`}</p>
    </div>
  );
}

const level = (n: number, max: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / Math.max(1, max)) * 4)));

/** Mapa de calor pilar × documento. Celda vacía: «sin evidencia», rayada y SIN número; nunca se dibuja un 0. */
export function Heatmap({ data }: { data: Coverage }) {
  const max = Math.max(0, ...data.rows.flatMap((r) => r.cells));
  return (
    <div className="heat-wrap">
      <table className="heat" data-testid="heatmap">
        <caption className="visually-hidden">Hallazgos vigentes por pilar y documento</caption>
        <thead>
          <tr>
            <th scope="col">Pilar</th>
            {data.docs.map((d) => (
              <th key={d} scope="col" className="heat-doc" title={d}>
                <span>{d}</span>
              </th>
            ))}
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.dimension}>
              <th scope="row">{r.label}</th>
              {r.cells.map((n, i) => (
                <td key={i} className={n === 0 ? 'heat-cell heat-empty' : `heat-cell heat-l${level(n, max)}`} data-tip={n === 0 ? `${r.label} · ${data.docs[i]}: sin evidencia` : `${r.label} · ${data.docs[i]}: ${n} ${n === 1 ? 'hallazgo vigente' : 'hallazgos vigentes'}`} tabIndex={0}>
                  {n === 0 ? <span className="visually-hidden">sin evidencia</span> : n}
                </td>
              ))}
              <td className="heat-total">{r.total === 0 ? <span className="visually-hidden">sin evidencia</span> : r.total}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            {data.colTotals.map((n, i) => (
              <td key={i} className="heat-total">{n === 0 ? <span className="visually-hidden">sin evidencia</span> : n}</td>
            ))}
            <td className="heat-total">{data.total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Matriz de puntos elemento × hallazgo. Una columna con «sin uso» marca los aceptados que ninguna acción usa. */
export function DotMatrix({ data }: { data: Provenance }) {
  return (
    <div className="heat-wrap">
      <table className="dots" data-testid="dot-matrix">
        <caption className="visually-hidden">Hallazgos de los que deriva cada riesgo o fase</caption>
        <thead>
          <tr>
            <th scope="col">Elemento</th>
            {data.cols.map((c) => (
              <th key={c.id} scope="col" title={c.title} className={data.unused.includes(c.id) ? 'dots-unused' : undefined}>
                {c.id}
                {data.unused.includes(c.id) && <span className="dots-flag"> sin uso</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">
                <span className="badge chip-horizon">{r.kind === 'riesgo' ? 'Riesgo' : 'Fase'}</span> {r.label}
              </th>
              {r.marks.map((m, i) => (
                <td key={i} className="dots-cell" data-tip={`${r.label} ${m ? 'deriva de' : 'no deriva de'} ${data.cols[i]!.id}`} tabIndex={0}>
                  {m ? <span className="dot" aria-hidden="true" /> : null}
                  <span className="visually-hidden">{m ? 'deriva de' : 'no deriva de'}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
