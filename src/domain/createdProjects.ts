// Proyectos creados por el Consultor (lote N, AG-032). Reglas puras: sin React ni almacenamiento.
import { COMPANIES } from '../data/companies';
import type { CreatedProject } from '../state/types';

export const NAME_MIN = 2;
export const NAME_MAX = 80;
export const SECTOR_MAX = 60;
export const NO_SECTOR = 'Sector no indicado';
export const CREATED_LABEL = 'Creado por ti';
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;

/** Para comparar nombres: sin distinguir mayúsculas ni espacios de más. */
export const normalizeName = (s: string): string => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');

/** Nombres ya usados: los de las empresas de ejemplo y los de los proyectos creados. */
export function existingNames(created: readonly CreatedProject[] = []): string[] {
  return [...COMPANIES.map((c) => c.name), ...created.map((c) => c.companyName)];
}

/** Devuelve el mensaje de error, o null si el nombre es válido. */
export function validateCompanyName(raw: string, existing: readonly string[]): string | null {
  if (CONTROL.test(raw)) return 'El nombre no puede tener saltos de línea ni caracteres no permitidos.';
  const name = raw.trim();
  if (name === '') return 'El nombre de la empresa es obligatorio.';
  if (name.length < NAME_MIN) return `El nombre debe tener al menos ${NAME_MIN} caracteres.`;
  if (name.length > NAME_MAX) return `El nombre debe tener como máximo ${NAME_MAX} caracteres.`;
  if (existing.some((n) => normalizeName(n) === normalizeName(name))) return 'Ya existe un proyecto con ese nombre de empresa. Usa otro nombre.';
  return null;
}

export function validateSector(raw: string | undefined): string | null {
  if (raw === undefined || raw.trim() === '') return null;
  if (CONTROL.test(raw)) return 'El sector no puede tener saltos de línea ni caracteres no permitidos.';
  if (raw.trim().length > SECTOR_MAX) return `El sector debe tener como máximo ${SECTOR_MAX} caracteres.`;
  return null;
}

/** `N-1`, `N-2`…: nunca choca con P-A a P-D ni con E-1 a E-3. */
export function nextProjectId(created: readonly CreatedProject[] = []): string {
  const max = created.reduce((m, c) => Math.max(m, Number(/^N-(\d+)$/.exec(c.id)?.[1] ?? 0)), 0);
  return `N-${max + 1}`;
}

export const isCreatedId = (id: string): boolean => /^N-\d{1,6}$/.test(id);
