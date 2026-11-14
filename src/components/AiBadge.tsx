/** Rótulo de todo contenido producido por el modelo (AG-023). El rótulo «Simulada» queda solo para el modo Simulado. */
export function aiBadgeText(model: string): string {
  return `Generado por IA (modelo ${model}) · requiere revisión humana`;
}

export function AiBadge({ model }: { model: string }) {
  return (
    <span className="badge badge-ai" data-testid="ai-badge">
      {aiBadgeText(model)}
    </span>
  );
}
