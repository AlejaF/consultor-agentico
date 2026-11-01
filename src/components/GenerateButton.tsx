import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SimBadge } from './badges';

interface Props {
  label: string;
  runningLabel: string;
  /** Si se indica, el botón queda bloqueado y se muestra el motivo con su enlace. */
  blocked?: { reason: string; href: string; linkLabel: string };
  onDone: () => void;
  durationMs?: number;
  children?: ReactNode;
}

/** Simulación de 1,5 s rotulada «Simulada»; sin doble ejecución (FR-005, FR-015, FR-016). */
export function GenerateButton({ label, runningLabel, blocked, onDone, durationMs = 1500 }: Props) {
  const [running, setRunning] = useState(false);
  const started = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function start() {
    if (started.current) return; // el doble clic no ejecuta dos veces
    started.current = true;
    setRunning(true);
    timer.current = setTimeout(() => {
      done.current();
    }, durationMs);
  }

  if (blocked) {
    return (
      <div>
        <button type="button" className="primary" aria-disabled="true" aria-describedby="generar-bloqueo" onClick={(e) => e.preventDefault()}>
          {label}
        </button>
        <p id="generar-bloqueo">
          {blocked.reason} <a href={blocked.href}>{blocked.linkLabel}</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <button type="button" className="primary" aria-disabled={running} aria-busy={running} onClick={start}>
        {label}
      </button>
      <div role="status" aria-live="polite" className="generating">
        {running && (
          <p>
            {runningLabel} <SimBadge />
          </p>
        )}
      </div>
    </div>
  );
}
