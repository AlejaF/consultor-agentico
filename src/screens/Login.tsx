import { homeOf, navigate, ROLE_LABEL } from '../app/router';
import { ResetDemoButton } from '../components/ResetDemoButton';
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
        <strong>Importante:</strong> el control por rol es solo de experiencia; no protege datos. Cualquiera puede
        cambiar de rol.
      </p>

      <h2>Cuentas de demostración</h2>
      <ul className="accounts">
        {ACCOUNTS.map((a) => (
          <li key={a.role} className="card account">
            <div>
              <p>
                <strong>{a.displayName}</strong>
              </p>
              <p className="subtitle">
                {ROLE_LABEL[a.role]} · {a.subtitle}
              </p>
            </div>
            <button
              type="button"
              className="primary"
              onClick={() => {
                dispatch({ type: 'setRole', role: a.role });
                navigate(homeOf(a.role));
              }}
            >
              Entrar como {ROLE_LABEL[a.role]}
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
          <strong>Contacto:</strong> ve el resumen del proyecto de su empresa ficticia.
        </li>
      </ul>

      <p>
        <ResetDemoButton />
      </p>
    </div>
  );
}
