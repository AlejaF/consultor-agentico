/** Etiqueta en mayúsculas del color primario encima del título (AG-034). Va antes del h1; no cambia su texto accesible. */
export function Kicker({ children }: { children: string }) {
  return <p className="kicker">{children}</p>;
}
