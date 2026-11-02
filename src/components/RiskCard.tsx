import type { DerivedItem } from '../domain/strategy';
import { DerivedFrom } from './DerivedFrom';

const LEVEL_CLASS = { alto: 'badge-danger', medio: 'badge-warn', bajo: 'badge-ok' } as const;

export function RiskCard({ item }: { item: DerivedItem }) {
  return (
    <article className="card" data-testid={`risk-${item.id}`}>
      <h3>{item.label}</h3>
      {item.level && (
        <p>
          <span className={`badge ${LEVEL_CLASS[item.level]}`}>Nivel {item.level}</span>
        </p>
      )}
      <p>{item.detail}</p>
      <DerivedFrom itemId={item.id} ids={item.derivedFrom} />
    </article>
  );
}
