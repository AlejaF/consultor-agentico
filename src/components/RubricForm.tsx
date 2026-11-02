import { useId, useState } from 'react';
import { RUBRIC_CRITERIA, RUBRIC_TITLE } from '../data/rubric';
import { gradingBlockReason } from '../domain/rubric';
import { useDirtyFlag } from '../state/unsaved';

const LEVELS = [1, 2, 3, 4, 5] as const;
const MAX_COMMENT = 2000;

/** Rúbrica de 4 criterios con niveles 1–5 (operable con flechas) y un comentario (FR-030). */
export function RubricForm({ onSave }: { onSave: (levels: Record<string, number>, comment: string) => void }) {
  const uid = useId();
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const reason = gradingBlockReason(levels);
  useDirtyFlag(`rubric-${uid}`, Object.keys(levels).length > 0 || comment !== '');

  return (
    <section className="card" aria-labelledby={`${uid}-t`}>
      <h2 id={`${uid}-t`}>Calificar la entrega</h2>
      <p className="subtitle">{RUBRIC_TITLE}</p>
      <p className="subtitle">Niveles de 1 (muy bajo) a 5 (muy alto).</p>
      <div className="stack">
        {RUBRIC_CRITERIA.map((c) => (
          <div key={c.id} className="criterion">
            <p id={`${uid}-${c.id}`} className="criterion-name">
              <strong>{c.name}</strong>
            </p>
            <p className="subtitle" id={`${uid}-${c.id}-d`}>
              {c.description}
            </p>
            <div role="radiogroup" aria-labelledby={`${uid}-${c.id}`} aria-describedby={`${uid}-${c.id}-d`} className="levels">
              {LEVELS.map((n) => (
                <label key={n} className="level">
                  <input
                    type="radio"
                    name={`${uid}-${c.id}`}
                    value={n}
                    checked={levels[c.id] === n}
                    onChange={() => setLevels((l) => ({ ...l, [c.id]: n }))}
                  />
                  <span>{n}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="field">
          <label htmlFor={`${uid}-c`}>Comentarios (opcional)</label>
          <textarea id={`${uid}-c`} rows={5} maxLength={MAX_COMMENT} value={comment} onChange={(e) => setComment(e.target.value)} />
          <p className="subtitle">
            {comment.length} de {MAX_COMMENT} caracteres
          </p>
        </div>
      </div>
      <button
        type="button"
        className="primary"
        aria-disabled={reason !== null}
        aria-describedby={reason ? `${uid}-bloqueo` : undefined}
        onClick={() => {
          if (reason === null) onSave(levels, comment);
        }}
      >
        Guardar calificación
      </button>
      {reason && (
        <p id={`${uid}-bloqueo`} role="status">
          {reason}
        </p>
      )}
    </section>
  );
}
