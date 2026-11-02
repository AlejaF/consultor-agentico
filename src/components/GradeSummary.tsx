import { PROGRAM_GOAL, RUBRIC_CRITERIA, RUBRIC_TITLE } from '../data/rubric';
import { formatDateTime, formatScore } from '../domain/format';
import type { Grading } from '../state/types';

/** Calificación guardada, de solo lectura (FR-031, FR-032). */
export function GradeSummary({ grading, title = 'Calificación del Líder' }: { grading: Grading; title?: string }) {
  return (
    <section className="card grade-summary" aria-label={title}>
      <h2>{title}</h2>
      <p>
        <span className="badge badge-ok">Calificada</span> <span className="subtitle">el {formatDateTime(grading.gradedAt)}</span>
      </p>
      <p className="subtitle">{RUBRIC_TITLE}</p>
      <ul className="list-plain grade-levels">
        {RUBRIC_CRITERIA.map((c) => (
          <li key={c.id}>
            <span>{c.name}</span> <strong>{grading.levels[c.id]} de 5</strong>
          </li>
        ))}
      </ul>
      {grading.comment.trim() === '' ? (
        <p className="grade-comment empty">Sin comentario</p>
      ) : (
        <p className="grade-comment">{grading.comment}</p>
      )}
      <p className="grade-average" data-testid="grade-average">
        Promedio: {formatScore(grading.average)} de 5
      </p>
      <p className="subtitle">Meta del programa (ilustrativa): {formatScore(PROGRAM_GOAL)} de 5</p>
    </section>
  );
}
