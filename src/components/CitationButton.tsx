interface Props {
  label: string;
  expanded: boolean;
  controls: string;
  onToggle: () => void;
}

/** La cita nombra el elemento de evidencia y su ubicación; se abre con teclado. */
export function CitationButton({ label, expanded, controls, onToggle }: Props) {
  return (
    <button type="button" className="citation" aria-expanded={expanded} aria-controls={controls} onClick={onToggle}>
      {label}
    </button>
  );
}
