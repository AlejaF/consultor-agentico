import { useState } from 'react';
import { navigate } from '../app/router';
import { useAppState } from '../state/context';
import { ConfirmDialog } from './ConfirmDialog';

export function ResetDemoButton() {
  const { resetDemo } = useAppState();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
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
        <p>Se borrará todo el progreso guardado en este navegador y la demo volverá a su estado inicial.</p>
      </ConfirmDialog>
    </>
  );
}
