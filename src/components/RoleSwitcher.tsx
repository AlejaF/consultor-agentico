import { useState } from 'react';
import { homeOf, navigate, ROLE_LABEL, type Role } from '../app/router';
import { useAppState } from '../state/context';
import { useUnsaved } from '../state/unsaved';
import { ConfirmDialog } from './ConfirmDialog';

const ROLES: Role[] = ['consultor', 'lider', 'contacto'];

/** Cambia de rol y va a su inicio sin tocar el resto del estado (FR-002). Con una edición sin guardar, pide confirmación. */
export function RoleSwitcher({ role }: { role: Role }) {
  const { dispatch } = useAppState();
  const { hasUnsaved } = useUnsaved();
  const [pending, setPending] = useState<Role | null>(null);

  function apply(next: Role) {
    dispatch({ type: 'setRole', role: next });
    navigate(homeOf(next));
  }

  return (
    <>
      <label htmlFor="rol-activo">Rol activo</label>
      <select
          id="rol-activo"
          value={role}
          onChange={(e) => {
            const next = e.target.value as Role;
            if (hasUnsaved()) setPending(next);
            else apply(next);
          }}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      <ConfirmDialog
        open={pending !== null}
        title="Hay una edición sin guardar"
        confirmLabel="Cambiar de rol"
        cancelLabel="Seguir editando"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) apply(pending);
          setPending(null);
        }}
      >
        <p>Si cambias de rol ahora, el texto que estás editando se perderá. El resto de tu progreso se conserva.</p>
      </ConfirmDialog>
    </>
  );
}
