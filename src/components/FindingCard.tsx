import { useEffect, useId, useRef, useState } from 'react';
import type { Finding } from '../data/diagnosis';
import { resolveName } from '../data/evidence';
import { resolveCitation, type ResolvedCitation } from '../domain/evidence';
import { isValidEdit } from '../domain/review';
import { useDirtyFlag } from '../state/unsaved';
import type { Decision } from '../state/types';
import { UnverifiedBadge } from './badges';
import { CitationButton } from './CitationButton';
import { EvidencePanel } from './EvidencePanel';

interface Props {
  finding: Finding;
  companyName: string;
  decision?: Decision;
  /** report: solo lectura del reporte · review: con acciones · readonly: revisión ya emitida. */
  mode: 'report' | 'review' | 'readonly';
  issued?: boolean;
  showHeadingLevel?: 2 | 3;
  onDecide?: (d: 'accepted' | 'rejected') => void;
  onEdit?: (text: string) => void;
}

function DecisionBadge({ decision, issued }: { decision: Decision; issued: boolean }) {
  switch (decision.state) {
    case 'accepted':
      return <span className="badge badge-ok">Aceptado</span>;
    case 'edited':
      return <span className="badge badge-warn">Editado por consultor</span>;
    case 'rejected':
      return <span className="badge badge-danger">{issued ? 'Rechazado · excluido del diagnóstico' : 'Rechazado'}</span>;
    default:
      return <span className="badge badge-pending">Pendiente</span>;
  }
}

export function FindingCard({ finding, companyName, decision, mode, issued = false, onDecide, onEdit }: Props) {
  const uid = useId();
  const baseText = resolveName(finding.text, companyName);
  const currentText = decision?.state === 'edited' ? decision.text : baseText;

  const citations = finding.citations.map((c) => resolveCitation(c, companyName)).filter((c): c is ResolvedCitation => c !== null);
  const [open, setOpen] = useState<string[]>([]);
  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const openCitations = citations.filter((c) => open.includes(c.excerptId));
  const idFor = (excerptId: string) => `${uid}-${excerptId}`;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentText);
  const [error, setError] = useState('');
  const areaRef = useRef<HTMLTextAreaElement>(null);
  useDirtyFlag(`finding-${uid}`, editing && draft !== currentText);
  useEffect(() => {
    if (editing) areaRef.current?.focus();
  }, [editing]);

  function save() {
    if (!isValidEdit(draft)) {
      setError('El texto no puede estar vacío. Escribe el hallazgo o cancela la edición.');
      areaRef.current?.focus();
      return;
    }
    onEdit?.(draft);
    setEditing(false);
    setError('');
  }

  const rejected = decision?.state === 'rejected';
  const noSupport = !finding.verified && (decision?.state === 'accepted' || decision?.state === 'edited');
  const actionable = mode === 'review';
  const title = finding.title;

  return (
    <article className={`finding card${openCitations.length ? ' has-panel' : ''}${rejected ? ' rejected' : ''}`} data-testid={`finding-${finding.id}`}>
      <div className="finding-main">
        <h3>{title}</h3>
        <p className="finding-badges">
          {decision && mode !== 'report' && <DecisionBadge decision={decision} issued={issued} />}
          {!finding.verified && <UnverifiedBadge />}
        </p>
        {!finding.verified && <p className="subtitle">{finding.unverifiedReason}</p>}
        {noSupport && <p className="subtitle no-support">No se usará como respaldo de la estrategia</p>}

        {editing ? (
          <div className="field">
            <label htmlFor={`${uid}-edit`}>Editar hallazgo: {title}</label>
            <textarea
              id={`${uid}-edit`}
              ref={areaRef}
              rows={5}
              value={draft}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${uid}-err` : undefined}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError('');
              }}
            />
            {error && (
              <p id={`${uid}-err`} role="alert" className="field-error">
                {error}
              </p>
            )}
            <div className="actions-row">
              <button type="button" className="primary" onClick={save}>
                Guardar edición
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError('');
                  setDraft(currentText);
                }}
              >
                Cancelar edición
              </button>
            </div>
          </div>
        ) : (
          <p className={rejected ? 'finding-text excluded' : 'finding-text'}>{currentText}</p>
        )}

        <div className="citations" role="group" aria-label="Citas de evidencia">
          {citations.map((c) => (
            <CitationButton
              key={c.excerptId}
              label={c.label}
              expanded={open.includes(c.excerptId)}
              controls={idFor(c.excerptId)}
              onToggle={() => toggle(c.excerptId)}
            />
          ))}
          {actionable && citations.length > 1 && (
            <button type="button" className="link-button" onClick={() => setOpen(citations.map((c) => c.excerptId))}>
              Ver toda la evidencia<span className="visually-hidden"> de: {title}</span>
            </button>
          )}
        </div>

        {actionable && !editing && (
          <div className="actions-row">
            <button type="button" aria-pressed={decision?.state === 'accepted'} onClick={() => onDecide?.('accepted')}>
              Aceptar<span className="visually-hidden"> hallazgo: {title}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(currentText);
                setEditing(true);
              }}
            >
              Editar<span className="visually-hidden"> hallazgo: {title}</span>
            </button>
            <button type="button" aria-pressed={decision?.state === 'rejected'} onClick={() => onDecide?.('rejected')}>
              Rechazar<span className="visually-hidden"> hallazgo: {title}</span>
            </button>
          </div>
        )}
      </div>
      {openCitations.length > 0 && (
        <div className="finding-panel">
          <EvidencePanel citations={openCitations} idFor={idFor} />
        </div>
      )}
    </article>
  );
}
