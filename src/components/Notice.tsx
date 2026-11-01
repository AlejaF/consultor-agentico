import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onDismiss?: () => void;
}

/** Aviso dentro de una región aria-live (la región la aporta AppShell). */
export function Notice({ children, onDismiss }: Props) {
  return (
    <div className={onDismiss ? 'notice' : 'notice notice-persistent'}>
      <span>{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Cerrar aviso">
          Cerrar
        </button>
      )}
    </div>
  );
}
