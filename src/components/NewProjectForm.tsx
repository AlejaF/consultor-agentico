import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { navigate } from '../app/router';
import { existingNames, nextProjectId, NAME_MAX, SECTOR_MAX, validateCompanyName, validateSector } from '../domain/createdProjects';
import { useAppState } from '../state/context';

export const NEW_PROJECT_NOTICE = 'El proyecto se guarda solo en este navegador. Los documentos se procesan con IA real (OpenAI).';

/**
 * Formulario «Nuevo proyecto» (AG-032), en la misma pantalla de Proyectos (sin pantallas nuevas). El nombre y el sector son DATOS:
 * se muestran siempre como texto. Los errores se anuncian (role="alert") y el foco vuelve al campo con error.
 */
export function NewProjectForm({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useAppState();
  const uid = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const sectorRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [sectorError, setSectorError] = useState<string | null>(null);
  useEffect(() => nameRef.current?.focus(), []);

  function submit(e: FormEvent) {
    e.preventDefault();
    const created = state.createdProjects ?? [];
    const ne = validateCompanyName(name, existingNames(created));
    const se = validateSector(sector);
    setNameError(ne);
    setSectorError(se);
    if (ne) return nameRef.current?.focus();
    if (se) return sectorRef.current?.focus();
    const id = nextProjectId(created);
    dispatch({ type: 'createProject', name, ...(sector.trim() ? { sector } : {}), at: new Date().toISOString() });
    onClose();
    navigate(`#/consultor/proyectos/${id}/evidencia`);
  }

  return (
    <section className="card" aria-labelledby={`${uid}-t`} data-testid="new-project-form">
      <h2 id={`${uid}-t`}>Nuevo proyecto</h2>
      <p>{NEW_PROJECT_NOTICE}</p>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor={`${uid}-n`}>Nombre de la empresa</label>
          <input
            id={`${uid}-n`}
            ref={nameRef}
            type="text"
            value={name}
            maxLength={NAME_MAX + 40}
            aria-required="true"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={`${uid}-nh${nameError ? ` ${uid}-ne` : ''}`}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="subtitle" id={`${uid}-nh`}>De 2 a {NAME_MAX} caracteres, en una sola línea. No puede repetir el nombre de otro proyecto.</p>
          {nameError && (
            <p className="field-error" id={`${uid}-ne`} role="alert" data-testid="name-error">
              {nameError}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor={`${uid}-s`}>Sector (opcional)</label>
          <input
            id={`${uid}-s`}
            ref={sectorRef}
            type="text"
            value={sector}
            aria-invalid={sectorError ? true : undefined}
            aria-describedby={sectorError ? `${uid}-se` : undefined}
            onChange={(e) => setSector(e.target.value)}
          />
          <p className="subtitle">Hasta {SECTOR_MAX} caracteres.</p>
          {sectorError && (
            <p className="field-error" id={`${uid}-se`} role="alert" data-testid="sector-error">
              {sectorError}
            </p>
          )}
        </div>
        <p>
          <button type="submit" className="primary">
            Crear proyecto
          </button>{' '}
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
        </p>
      </form>
    </section>
  );
}
