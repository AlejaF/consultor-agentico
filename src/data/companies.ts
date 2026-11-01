export interface Company {
  id: string;
  name: string;
  sector: string;
  size: string;
}

/** Nombres inventados y evidentemente falsos (principio I). */
export const COMPANIES: readonly Company[] = [
  { id: 'C-A', name: 'Empresa Ficticia Alfa', sector: 'Manufactura (ejemplo)', size: 'Mediana' },
  { id: 'C-B', name: 'Empresa Ficticia Beta', sector: 'Servicios (ejemplo)', size: 'Pequeña' },
  { id: 'C-C', name: 'Empresa Ficticia Gamma', sector: 'Comercio (ejemplo)', size: 'Mediana' },
  { id: 'C-D', name: 'Empresa Ficticia Delta', sector: 'Logística (ejemplo)', size: 'Pequeña' },
  { id: 'C-E1', name: 'Empresa Ficticia Épsilon', sector: 'Educación (ejemplo)', size: 'Pequeña' },
  { id: 'C-E2', name: 'Empresa Ficticia Zeta', sector: 'Salud (ejemplo)', size: 'Mediana' },
  { id: 'C-E3', name: 'Empresa Ficticia Eta', sector: 'Energía (ejemplo)', size: 'Grande' },
];
