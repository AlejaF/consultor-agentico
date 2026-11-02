import type { ReactNode } from 'react';

export interface Column {
  key: string;
  label: string;
}
export interface Row {
  id: string;
  cells: Record<string, ReactNode>;
}

/** Tabla que por debajo de 640 px se reorganiza en una tarjeta por fila (con roles explícitos para conservar la semántica). */
export function ResponsiveTable({ caption, columns, rows, testId }: { caption: string; columns: Column[]; rows: Row[]; testId?: string }) {
  return (
    <table className="rtable" role="table" data-testid={testId}>
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr role="row">
          {columns.map((c) => (
            <th key={c.key} role="columnheader" scope="col">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} role="row">
            {columns.map((c, i) =>
              i === 0 ? (
                <th key={c.key} role="rowheader" scope="row">
                  {r.cells[c.key]}
                </th>
              ) : (
                <td key={c.key} role="cell" data-label={c.label}>
                  {r.cells[c.key]}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
