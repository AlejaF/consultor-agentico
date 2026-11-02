export interface Company {
  id: string;
  name: string;
  sector: string;
  size: string;
  /** Ciudad y sitio web inventados (FR-056); el sitio usa el dominio reservado .example. */
  city: string;
  website: string;
}

/** Nombres inventados y evidentemente falsos (principio I). */
export const COMPANIES: readonly Company[] = [
  { id: 'C-A', name: 'Empresa Ficticia Alfa', sector: 'Manufactura (ejemplo)', size: 'Mediana', city: 'Ciudad Ejemplo del Sur', website: 'alfa.ficticia.example' },
  { id: 'C-B', name: 'Empresa Ficticia Beta', sector: 'Servicios (ejemplo)', size: 'Pequeña', city: 'Villa Ejemplo', website: 'beta.ficticia.example' },
  { id: 'C-C', name: 'Empresa Ficticia Gamma', sector: 'Comercio (ejemplo)', size: 'Mediana', city: 'Puerto Ejemplo', website: 'gamma.ficticia.example' },
  { id: 'C-D', name: 'Empresa Ficticia Delta', sector: 'Logística (ejemplo)', size: 'Pequeña', city: 'Valle Ejemplo', website: 'delta.ficticia.example' },
  { id: 'C-E1', name: 'Empresa Ficticia Épsilon', sector: 'Educación (ejemplo)', size: 'Pequeña', city: 'Monte Ejemplo', website: 'epsilon.ficticia.example' },
  { id: 'C-E2', name: 'Empresa Ficticia Zeta', sector: 'Salud (ejemplo)', size: 'Mediana', city: 'Lago Ejemplo', website: 'zeta.ficticia.example' },
  { id: 'C-E3', name: 'Empresa Ficticia Eta', sector: 'Energía (ejemplo)', size: 'Grande', city: 'Costa Ejemplo', website: 'eta.ficticia.example' },
];
