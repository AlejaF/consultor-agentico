import type { ReactNode } from 'react';

export function KpiCard({ label, value, testId, hint }: { label: string; value: string; testId: string; hint?: ReactNode }) {
  return (
    <div className="card kpi" data-testid={testId}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {hint && <p className="subtitle">{hint}</p>}
    </div>
  );
}
