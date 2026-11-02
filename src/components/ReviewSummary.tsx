import { useState } from 'react';
import { countOf } from '../domain/format';
import { ConfirmDialog } from './ConfirmDialog';
import { ProgressBar } from './ProgressBar';

interface Props {
  reviewed: number;
  total: number;
  accepted: number;
  edited: number;
  rejected: number;
  blockReason: string | null;
  onIssue: () => void;
}

export function ReviewSummary({ reviewed, total, accepted, edited, rejected, blockReason, onIssue }: Props) {
  const [confirm, setConfirm] = useState(false);
  return (
    <section className="card" aria-labelledby="resumen-revision">
      <h2 id="resumen-revision">Avance de la revisión</h2>
      <p data-testid="review-progress">
        <strong>
          {reviewed} de {total} hallazgos revisados
        </strong>
      </p>
      <ProgressBar percent={total === 0 ? 0 : Math.round((reviewed / total) * 100)} label="Avance de la revisión" />
      <p className="subtitle">
        {countOf(accepted, 'aceptado', 'aceptados')} · {countOf(edited, 'editado', 'editados')} · {countOf(rejected, 'rechazado', 'rechazados')}
      </p>
      <button
        type="button"
        className="primary"
        aria-disabled={blockReason !== null}
        aria-describedby={blockReason ? 'emitir-bloqueo' : undefined}
        onClick={() => {
          if (blockReason === null) setConfirm(true);
        }}
      >
        Aprobar y emitir
      </button>
      {blockReason && (
        <p id="emitir-bloqueo" role="status">
          {blockReason}
        </p>
      )}
      <ConfirmDialog
        open={confirm}
        title="¿Aprobar y emitir el diagnóstico?"
        confirmLabel="Sí, aprobar y emitir"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          onIssue();
        }}
      >
        <p>
          El diagnóstico quedará «Emitido» y de solo lectura. Los hallazgos rechazados ({rejected}) quedarán excluidos.
        </p>
        <p>El Líder podrá revisarlo y calificarlo después; no necesitas su aprobación para continuar con la estrategia.</p>
      </ConfirmDialog>
    </section>
  );
}
