import { useState } from 'react';
import { navigate } from '../app/router';
import { useAppState } from '../state/context';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Único «Restablecer demo» (FR-006), en la cabecera. Si no cabe el texto completo (320 px) se muestra «Restablecer»;
 * el nombre accesible es siempre «Restablecer demo» y contiene la etiqueta visible.
 */
export function ResetDemoButton() {
  const { resetDemo } = useAppState();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="reset-demo" aria-label="Restablecer demo" onClick={() => setOpen(true)}>
        <span>Restablecer</span>
        <span className="reset-more"> demo</span>
      </button>
      <ConfirmDialog
        open={open}
        title="¿Restablecer la demo?"
        confirmLabel="Sí, restablecer"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          resetDemo();
          navigate('#/');
        }}
      >
        <p>Se borrarán tus cambios en este navegador.</p>
      </ConfirmDialog>
    </>
  );
}
