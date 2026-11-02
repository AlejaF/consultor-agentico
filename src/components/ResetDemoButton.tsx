import { useState } from 'react';
import { navigate } from '../app/router';
import { useAppState } from '../state/context';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Único «Restablecer demo» (FR-006), en la cabecera, siempre con el texto completo (que es también su nombre accesible).
 */
export function ResetDemoButton() {
  const { resetDemo } = useAppState();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="reset-demo" onClick={() => setOpen(true)}>
        Restablecer demo
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
