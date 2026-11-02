import { useState } from 'react';
import { navigate } from '../app/router';
import { useAppState } from '../state/context';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Único «Restablecer demo» (FR-006), en la cabecera. El nombre accesible es siempre «Restablecer demo»; en menos de 768 px
 * la etiqueta visible es «Restablecer» (contenida en el nombre accesible) y desde 768 px, el texto completo.
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
        <p>Se borrarán tus cambios en este navegador y la demo volverá a su estado inicial, con los datos de ejemplo.</p>
      </ConfirmDialog>
    </>
  );
}
