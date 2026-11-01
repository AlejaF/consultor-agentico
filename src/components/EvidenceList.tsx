import { useState } from 'react';
import type { EvidenceItem } from '../domain/evidence';
import { fileTypeLabel, formatSize } from '../domain/format';
import { addedThisSession } from '../state/session';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  items: readonly EvidenceItem[];
  onRemove: (fileId: string) => void;
}

function Item({ item, onAskRemove }: { item: EvidenceItem; onAskRemove: (i: EvidenceItem) => void }) {
  const own = item.origin === 'propio';
  const persisted = own && item.file && !addedThisSession.has(item.file.id);
  return (
    <li className="evidence-item">
      <div>
        <p>
          <strong>{item.name}</strong>
        </p>
        <p className="subtitle">
          {own ? `${fileTypeLabel(item.file!.name)} · ${formatSize(item.file!.size)}` : item.detail}
        </p>
        <p>
          {own ? (
            <span className="badge badge-pending">Cargado localmente · no analizado</span>
          ) : (
            <span className="badge badge-sim">Evidencia de ejemplo (ficticia)</span>
          )}{' '}
          {item.processing && <span className="badge badge-warn">Procesando</span>}
        </p>
        {persisted && <p className="subtitle">Contenido no conservado en esta demo.</p>}
      </div>
      {own && (
        <button type="button" onClick={() => onAskRemove(item)} aria-label={`Quitar ${item.name}`}>
          Quitar
        </button>
      )}
    </li>
  );
}

function Group({ title, items, empty, onAskRemove }: { title: string; items: readonly EvidenceItem[]; empty: string; onAskRemove: (i: EvidenceItem) => void }) {
  return (
    <section className="card" aria-label={title}>
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="subtitle">{empty}</p>
      ) : (
        <ul className="list-plain">
          {items.map((i) => (
            <Item key={i.id} item={i} onAskRemove={onAskRemove} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function EvidenceList({ items, onRemove }: Props) {
  const [target, setTarget] = useState<EvidenceItem | null>(null);
  const interviews = items.filter((i) => i.kind !== 'documento');
  const documents = items.filter((i) => i.kind === 'documento');
  return (
    <>
      <Group title="Entrevistas y transcripciones" items={interviews} empty="Aún no hay entrevistas ni transcripciones." onAskRemove={setTarget} />
      <Group title="Documentos" items={documents} empty="Aún no hay documentos." onAskRemove={setTarget} />
      <ConfirmDialog
        open={target !== null}
        title="¿Quitar este archivo?"
        confirmLabel="Sí, quitar"
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (target?.file) onRemove(target.file.id);
          setTarget(null);
        }}
      >
        <p>Se quitará «{target?.name}» de la lista y del progreso de captura. Tu archivo original no se modifica.</p>
      </ConfirmDialog>
    </>
  );
}
