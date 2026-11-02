import { useState } from 'react';
import { SimBadge } from '../../components/badges';
import { COMPANY_PROJECT_ID, SURVEY_QUESTIONS } from '../../data/survey';
import { formatDateTime } from '../../domain/format';
import { projectInfo } from '../../domain/lookup';
import { useAppState } from '../../state/context';

const LEVELS = [1, 2, 3, 4, 5] as const;

/** Encuesta simulada de 3 preguntas: se guarda solo en este navegador, sin envíos ni correos (FR-036). */
export function Survey() {
  const { state, dispatch } = useAppState();
  const { company } = projectInfo(COMPANY_PROJECT_ID);
  const saved = state.surveys[COMPANY_PROJECT_ID];
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  function save() {
    const missing = SURVEY_QUESTIONS.filter((q) => !answers[q.id]);
    if (missing.length > 0) {
      setError(`${missing.length === 1 ? 'Falta 1 pregunta por responder' : `Faltan ${missing.length} preguntas por responder`}: ${missing.map((q) => `«${q.text}»`).join(' ')}`);
      return;
    }
    setError('');
    dispatch({ type: 'submitSurvey', projectId: COMPANY_PROJECT_ID, answers, at: new Date().toISOString() });
  }

  return (
    <>
      <h1>Encuesta</h1>
      <p>
        {company.name} · Proyecto {COMPANY_PROJECT_ID}
      </p>
      <p>
        <SimBadge />
      </p>
      {saved ? (
        <section className="card" aria-labelledby="encuesta-resultado">
          <h2 id="encuesta-resultado">Sus respuestas</h2>
          <p data-testid="encuesta-confirmacion">Respuestas guardadas en este navegador (simulado); no se envió a nadie.</p>
          {saved.submittedAt && <p className="subtitle">Guardadas el {formatDateTime(saved.submittedAt)}</p>}
          <ul className="list-plain stack" data-testid="encuesta-respuestas">
            {SURVEY_QUESTIONS.map((q) => (
              <li key={q.id}>
                {q.text} <strong>{String(saved.answers[q.id])} de 5</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card" aria-labelledby="encuesta-form">
          <h2 id="encuesta-form">Encuesta corta</h2>
          <p className="subtitle">Tres preguntas obligatorias, de 1 (muy bajo) a 5 (muy alto). Es una simulación: no se envía a nadie.</p>
          <div className="stack">
            {SURVEY_QUESTIONS.map((q) => (
              <div key={q.id} className="criterion">
                <p id={`enc-${q.id}`}>
                  <strong>{q.text}</strong>
                </p>
                <div role="radiogroup" aria-labelledby={`enc-${q.id}`} className="levels">
                  {LEVELS.map((n) => (
                    <label key={n} className="level">
                      <input type="radio" name={`enc-${q.id}`} value={n} checked={answers[q.id] === n} onChange={() => setAnswers((a) => ({ ...a, [q.id]: n }))} />
                      <span>{n}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <button type="button" className="primary" onClick={save}>
            Guardar respuestas
          </button>
        </section>
      )}
    </>
  );
}
