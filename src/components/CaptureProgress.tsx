import type { CaptureProgress as Progress } from '../domain/progress';
import { ProgressBar } from './ProgressBar';

export function CaptureProgress({ progress }: { progress: Progress }) {
  return (
    <section className="card" aria-labelledby="progreso-titulo">
      <h2 id="progreso-titulo">Progreso de captura</h2>
      <ProgressBar percent={progress.percent} label="Progreso de captura" />
      <ul className="list-plain">
        <li>
          Preguntas respondidas: {progress.questionsAnswered} de {progress.questionsTotal}
        </li>
        <li>Entrevistas y transcripciones: {progress.interviews}</li>
        <li>Documentos: {progress.documents}</li>
      </ul>
    </section>
  );
}
