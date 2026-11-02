export function KpiCard({ label, value, testId, hint }: { label: string; value: string; testId: string; hint?: string }) {
  return (
    <div className="card kpi" data-testid={testId}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {hint && <p className="subtitle">{hint}</p>}
    </div>
  );
}
