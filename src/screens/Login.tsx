import { homeOf, navigate, ROLE_LABEL } from '../app/router';
import { ACCOUNTS } from '../data/accounts';
import { useAppState } from '../state/context';

export function Login() {
  const { dispatch } = useAppState();
  return (
    <div className="login">
      <div className="brand-hero">
        <img src={`${import.meta.env.BASE_URL}emblema.svg`} alt="" width="48" height="48" />
        <h1>Consultor Agéntico</h1>
      </div>
      <p>
        Demostración navegable del recorrido Evidencia → Diagnóstico → Estrategia. Elige una cuenta de ejemplo: no
        hay contraseñas ni datos reales.
      </p>
      <p>
        <strong>Importante:</strong> el control por rol solo sirve para probar cada perfil; no protege datos. Cualquiera puede
        cambiar de rol.
      </p>

      <h2>Cuentas de demostración</h2>
      <ul className="accounts">
        {ACCOUNTS.map((a) => (
          <li key={a.role} className="account">
            <button
              type="button"
              className="account-link"
              aria-label={`Entrar como ${ROLE_LABEL[a.role]}: ${a.displayName}. ${ROLE_LABEL[a.role]} · ${a.subtitle}`}
              onClick={() => {
                dispatch({ type: 'setRole', role: a.role });
                navigate(homeOf(a.role));
              }}
            >
              <span className="account-text">
                <strong>{a.displayName}</strong>
                <span className="subtitle">
                  {ROLE_LABEL[a.role]} · {a.subtitle}
                </span>
              </span>
              <span className="account-enter" aria-hidden="true">
                Entrar →
              </span>
            </button>
          </li>
        ))}
      </ul>

      <h2>Quién hace qué</h2>
      <ul>
        <li>
          <strong>Consultor:</strong> carga evidencia, genera y revisa el diagnóstico y la estrategia.
        </li>
        <li>
          <strong>Líder:</strong> revisa y califica las entregas de los equipos.
        </li>
        <li>
          <strong>Empresa:</strong> recibe el informe de la empresa ficticia (vista aún no disponible en esta demostración).
        </li>
      </ul>
    </div>
  );
}
