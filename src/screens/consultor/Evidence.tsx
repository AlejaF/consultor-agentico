import { useRef } from 'react';
import { CaptureProgress } from '../../components/CaptureProgress';
import { EvidenceList } from '../../components/EvidenceList';
import { FileDropzone } from '../../components/FileDropzone';
import { Notice } from '../../components/Notice';
import { QuestionForm } from '../../components/QuestionForm';
import { COMPANIES } from '../../data/companies';
import { PROJECTS } from '../../data/projects';
import { CAPTURE_QUESTIONS } from '../../data/questions';
import { buildEvidenceItems } from '../../domain/evidence';
import { canGenerate, captureProgress } from '../../domain/progress';
import { useAppState } from '../../state/context';
import { addedThisSession, newFileId } from '../../state/session';

export function Evidence({ projectId }: { projectId: string }) {
  const { state, dispatch } = useAppState();
  const uploadRef = useRef<HTMLButtonElement>(null);
  const project = PROJECTS.find((p) => p.id === projectId)!;
  const company = COMPANIES.find((c) => c.id === project.companyId)!;
  const ps = state.projects[projectId];

  const items = buildEvidenceItems(project, company.name, ps.localFiles);
  const progress = captureProgress(
    CAPTURE_QUESTIONS.map((q) => q.id),
    ps.answers,
    items.map((i) => i.kind),
  );
  const allowed = canGenerate(items.length);
  const status = ps.diagnosis.status;
  const diagnosisHref = `#/consultor/proyectos/${projectId}/diagnostico`;

  return (
    <>
      <p>
        <a className="btn" href="#/consultor">← Proyectos</a>
      </p>
      <h1>Captura de evidencia</h1>
      <p>
        {company.name} · Proyecto {project.id}
      </p>

      {status === 'issued' && (
        <Notice>El diagnóstico ya está emitido: la nueva evidencia no se refleja en el diagnóstico emitido.</Notice>
      )}

      <div className="evidence-layout">
        <div className="evidence-main">
          <QuestionForm
            questions={CAPTURE_QUESTIONS}
            answers={ps.answers}
            onChange={(questionId, value) => dispatch({ type: 'setAnswer', projectId, questionId, value })}
          />
          <FileDropzone
            buttonRef={uploadRef}
            existingNames={ps.localFiles.map((f) => f.name)}
            onAccepted={(files) => {
              const metas = files.map((f) => ({ ...f, id: newFileId(), addedAt: new Date().toISOString() }));
              metas.forEach((m) => addedThisSession.add(m.id));
              dispatch({ type: 'addFiles', projectId, files: metas });
            }}
          />
          <EvidenceList items={items} onRemove={(fileId) => dispatch({ type: 'removeFile', projectId, fileId })} />
        </div>

        <aside className="evidence-side">
          <CaptureProgress progress={progress} />
          <section className="card" aria-labelledby="generar-titulo">
            <h2 id="generar-titulo">Diagnóstico</h2>
            {allowed ? (
              <a className="btn primary" href={diagnosisHref}>
                {status === 'none' ? 'Generar diagnóstico' : 'Ver diagnóstico'}
              </a>
            ) : (
              <>
                <button type="button" className="primary" aria-disabled="true" aria-describedby="generar-motivo" onClick={(e) => e.preventDefault()}>
                  Generar diagnóstico
                </button>
                <p id="generar-motivo">
                  Este proyecto no tiene evidencia. Agrega al menos un archivo para poder generar el diagnóstico.{' '}
                  <button type="button" className="link-button" onClick={() => uploadRef.current?.focus()}>
                    Ir a agregar archivos
                  </button>
                </p>
              </>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
