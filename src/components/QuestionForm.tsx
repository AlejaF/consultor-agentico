import { useId } from 'react';
import type { CaptureQuestion } from '../data/questions';

interface Props {
  questions: readonly CaptureQuestion[];
  answers: Record<string, string>;
  onChange: (questionId: string, value: string) => void;
}

export function QuestionForm({ questions, answers, onChange }: Props) {
  const prefix = useId();
  return (
    <section className="card" aria-labelledby={`${prefix}-t`}>
      <h2 id={`${prefix}-t`}>Preguntas de diagnóstico</h2>
      <div className="form-grid">
        {questions.map((q) => {
          const id = `${prefix}-${q.id}`;
          return (
            <div key={q.id} className="field">
              <label htmlFor={id}>{q.label}</label>
              {q.kind === 'select' ? (
                <select id={id} value={answers[q.id] ?? ''} onChange={(e) => onChange(q.id, e.target.value)}>
                  <option value="">Selecciona una opción</option>
                  {q.options!.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input id={id} type="text" value={answers[q.id] ?? ''} onChange={(e) => onChange(q.id, e.target.value)} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
