/**
 * Rótulo de todo contenido producido por el modelo (AG-023, enmienda 2.1.0): NO lleva el nombre del modelo. El modelo, la fecha y los
 * tokens se ven solo en la traza y en la ficha técnica, para roles internos. «Simulada» queda solo para el modo Simulado.
 */
export function aiBadgeText(): string {
  return 'Generado por IA · requiere revisión humana';
}

export function AiBadge() {
  return (
    <span className="badge badge-ai" data-testid="ai-badge">
      {aiBadgeText()}
    </span>
  );
}
