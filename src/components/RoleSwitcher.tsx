import { homeOf, navigate, ROLE_LABEL, type Role } from '../app/router';
import { useAppState } from '../state/context';

const ROLES: Role[] = ['consultor', 'lider', 'contacto'];

/** Cambia de rol y va a su inicio sin tocar el resto del estado (FR-002). */
export function RoleSwitcher({ role }: { role: Role }) {
  const { dispatch } = useAppState();
  return (
    <label>
      Rol activo
      <select
        value={role}
        onChange={(e) => {
          const next = e.target.value as Role;
          dispatch({ type: 'setRole', role: next });
          navigate(homeOf(next));
        }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
    </label>
  );
}
